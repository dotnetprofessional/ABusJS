import { IBus, Bus, IMessageTask, IMessageHandlerContext } from "..";
import { IMessage } from "../IMessage";
import { IBubble, IDelayBubble, IBubbleFlowResult, IBubbleResult } from "./Bubble";
import chalk, { Chalk } from "chalk";
import * as diff from "diff";
import { MessageException } from "../tasks/MessageException";
import { TimeSpan } from "../Timespan";
import { Intents } from "../Intents";
import { MessageTracingTask } from "../tasks/abus-tracing/MessageTracingTask";
import { IMessageTracing } from "../tasks/abus-tracing/MessagePerformanceTask";
import { DebugLoggingTask } from "../tasks/DebugLoggingTask";
import { IBusMetaData } from "../IBusMetaData";

export interface ColorTheme {
    statusPass: Chalk;
    statusFail: Chalk;
}

export class BubblesTask implements IMessageTask {
    constructor(private bubbles: Bubbles) {

    }
    public async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any): Promise<void> {
        if (!await this.bubbles.messageHandlerAsync(message, context)) {
            await next();
        }
    }
}

export class Bubbles {
    private messages: IBubbleMessage[];
    private bubbleFlowResult: IBubbleFlowResult[] = [];
    private bubbleFlow: IBubble[];
    private bubbleFlowIndex: number = 0;
    private executionPromise: { resolve: any, reject: any };
    protected colorTheme: ColorTheme = { statusFail: chalk.redBright, statusPass: chalk.greenBright };

    constructor(public bus?: IBus) {
        if (!bus) {
            this.bus = this.initializeBus();
        }

        // add the bubbles task to the bus pipeline. This needs to be the outbound pipeline
        // as for transports that go off device you won't get access to the inbound pipeline
        // TODO: This needs to be applied to all transports defined
        this.bus.usingRegisteredTransportToMessageType("*")
            .outboundPipeline
            .useLocalMessagesReceivedTasks(new MessageTracingTask()).and
            .useTransportMessageReceivedTasks(new BubblesTask(this)).and
        // .andAlso()
        // .inboundPipeline.useTransportMessageReceivedTasks(new DebugLoggingTask("inbound:")).andAlso()
        // .outboundPipeline.useTransportMessageReceivedTasks(new DebugLoggingTask("outbound:"));

    }

    public async executeAsync(workflow: string, messages: IBubbleMessage[] = []): Promise<void> {
        // ensure we have a workflow being passed in
        if (!workflow) {
            throw new Error("No workflow definition defined");
        }

        return new Promise(async (resolve, reject) => {
            try {
                this.executionPromise = { resolve, reject };

                this.messages = messages;
                this.processWorkflowDefinition(workflow);
                this.validateDefinition();

                // 3. Execute workflow/bubble flow
                await this.executeBubbleFlowAsync();
            } catch (e) {
                reject(e);
            }
        });
    }

    private validateResult(expected: any, message: any, bubble: IBubble): IBubbleResult {
        // check if the message is a reply as they do not send a full IMessage<T> just the payload
        // also ensure that expected is not a full IMessage<T>
        let actual: Object;
        if (message.type.endsWith(".reply")) {
            // a reply
            if (expected.type) {
                throw new Error(`[Bubble: ${bubble.name}] Bubble definitions for a reply should contain just the payload.`);
            }
            if (this.isMessageExceptionReply(message)) {
                actual = this.trimToExpected(expected, { error: message.payload.description })
            } else {
                actual = this.trimToExpected(expected, message.payload);
            }
        } else if (message.type === MessageException.type) {
            // We maybe trying to validate an exceptin or there just may have been an 
            // unexpected one so need to treat those differently
            if (!expected.type) {
                actual = this.trimToExpected(expected, { error: message.payload.description });
            } else {
                throw new Error(`[Bubble: ${bubble.name}] An error occurred processing the flow. \n${JSON.stringify(message, null, 2)}`);
            }
        } else {
            // check that the expected type matches the actual, if not seems we got a different message so no need to compare them
            if (expected.type === message.type) {
                actual = this.trimToExpected(expected, message);
            } else {
                actual = message;
            }
        }
        let diff = "";
        const match = JSON.stringify(expected) === JSON.stringify(actual);
        if (!match) {
            diff = this.createUnifiedDiff(actual, expected);
        }
        return { isValid: match, diff };
    }

    public validate(): void {
        for (let i = 0; i < this.bubbleFlowResult.length; i++) {
            const bubbleResult = this.bubbleFlowResult[i];
            if (!bubbleResult.result.isValid) {
                let errorMessage = `bubble: ${bubbleResult.bubble.name}\n${bubbleResult.result.diff}`;
                if (bubbleResult.actual.type === MessageException.type) {
                    errorMessage += `\n${MessageException.type}:${bubbleResult.actual.payload.error}`;
                }
                throw new Error(errorMessage);
            }
        }
    }

    public result(): IBubbleFlowResult[] {
        return this.bubbleFlowResult;
    }

    public toMermaidFlowDiagram(): string {
        let output = "graph TD\n";

        // define the processes
        const processes: Set<string> = new Set();
        this.bubbleFlowResult.forEach(bubble => {
            if (bubble.actual.metaData.receivedBy) {
                processes.add(bubble.actual.metaData.receivedBy);
            }
        });

        processes.forEach(process => {
            // at this point can add styles too
            output += "\n" + process;
        });

        // associate messages with processes
        this.bubbleFlowResult.forEach(bubble => {
            const actual = bubble.actual;
            // lookup the parent process based on the correlationId
            const parentProcessIdentifier = this.getParentIdentifier(bubble);

            if (actual.metaData.intent === Intents.reply) {
                actual.metaData.receivedBy = this.getParentIdentifier(this.getParentBubble(bubble));
            }

            const event = `${parentProcessIdentifier} --> |${actual.type}| ${actual.metaData.receivedBy || "unhandled"}`;
            // at this point can add syles too
            output += "\n" + event;
        });

        return output;
    }

    public toMermaidSequenceDiagram(): string {
        let output = "sequenceDiagram\nparticipant start";

        // define the processes
        const processes: Set<string> = new Set();
        this.bubbleFlowResult.forEach(bubble => {
            if (bubble.actual.metaData.receivedBy) {
                processes.add(bubble.actual.metaData.receivedBy);
            }
        });

        processes.forEach(process => {
            // at this point can add styles too
            output += "\nparticipant " + process;
        });

        // associate messages with processes
        this.bubbleFlowResult.forEach(bubble => {
            const actual = bubble.actual;
            // lookup the parent process based on the correlationId
            const parentProcessIdentifier = this.getParentIdentifier(bubble);

            let event: string;
            if (actual.metaData.intent === Intents.reply) {
                actual.metaData.receivedBy = this.getParentIdentifier(this.getParentBubble(bubble));
                event = `${parentProcessIdentifier}-->>${actual.metaData.receivedBy || "unhandled"}:${actual.type}`;
            } else {
                event = `${parentProcessIdentifier}->>${actual.metaData.receivedBy || "unhandled"}:${actual.type}`;

            }
            // const event = `${parentProcessIdentifier} --> |${actual.type}| ${actual.metaData.receivedBy || "unhandled"}`;

            // at this point can add syles too
            output += "\n" + event;
        });

        return output;
    }

    private getParentBubble(bubble: IBubbleFlowResult): IBubbleFlowResult {
        const parentProcess = this.bubbleFlowResult.filter(r => (r.actual.metaData as IMessageTracing).messageId === (bubble.actual.metaData as IMessageTracing).correlationId);
        return parentProcess[0];
    }

    private getParentIdentifier(bubble: IBubbleFlowResult): string {
        const parentProcess = this.getParentBubble(bubble);
        let parentProcessIdentifier: string;
        if (!parentProcess) {
            parentProcessIdentifier = "start";
        } else {
            parentProcessIdentifier = parentProcess.actual.metaData.receivedBy;
        }
        return parentProcessIdentifier
    }

    private trimToExpected(expected: Object, actual: Object): Object {
        // expected drives the comparison
        const copy = function (primary: Object, secondary: Object): Object {
            let result;
            if (Array.isArray(primary)) {
                result = [];
                for (let i = 0; i < primary.length; i++) {
                    result.push(copy(primary[i], secondary[i]));
                }
            } else {

                if (typeof primary === "string") {
                    // This handles simply string types such as replies
                    result = secondary;
                } else {

                    result = {};

                    for (let key in primary) {
                        if (typeof primary[key] === "object") {
                            result[key] = copy(primary[key], secondary[key]);
                        } else {
                            if (!secondary) {
                                throw new Error(`Missing property '${key}' in actual expected ${JSON.stringify(result)}`);
                            }
                            result[key] = secondary[key];
                        }
                    }
                }
            }
            return result;
        }

        return copy(expected, actual);
    }

    public async messageHandlerAsync(message: IMessage<any>, context: IMessageHandlerContext): Promise<boolean> {
        try {
            const bubble = this.bubbleFlow[this.bubbleFlowIndex];

            this.bubbleFlowIndex++;
            const expected = this.getMessage(bubble.name).message;
            const result = this.validateResult(expected, message, bubble);
            this.bubbleFlowResult.push({ bubble, actual: message, expected, result });

            // determine if this message should be auto handled
            const nextBubble = this.bubbleFlow[this.bubbleFlowIndex];
            if (nextBubble && (nextBubble.source === BubbleSource.supplied)) {
                this.handleBubbleMessage(nextBubble, context);
                return true;
            } else {
                if (this.bubbleFlowIndex >= this.bubbleFlow.length) {
                    this.executionPromise.resolve();
                    return true;
                }
                return false;
            }
        } catch (e) {
            context.DoNotContinueDispatchingCurrentMessageToHandlers();
            this.executionPromise.reject(e);
        }
    }

    private processWorkflowDefinition(workflow: string) {
        const blockReader = new TextBlockReader(workflow);

        // 1. get the message flow from the definition
        this.bubbleFlow = this.getWorkflowDefinition(blockReader);

        // 2. get any messages that have been defined
        this.extractMessageDefinitions(blockReader);
    }

    private async executeBubbleFlowAsync(): Promise<void> {
        const firstBubble = this.bubbleFlow[0];
        if (firstBubble.source != BubbleSource.supplied) {
            throw new Error("The first bubble in a definition must be marked as supplied ie (!my-first-bubble)");
        }

        this.handleBubbleMessage(firstBubble);
    }

    private handleBubbleMessage(bubble: IBubble, context?: IMessageHandlerContext, delay?: number) {
        let msg = this.getMessage(bubble.name).message;

        if (bubble.type !== BubbleType.reply) {
            msg.metaData = msg.metaData || {};
            (msg.metaData as IBusMetaData).receivedBy = "Bubbles";
        }

        if (msg.error) {
            // this is an error so we need to convert it to a bus exception
            const error = new Error(msg.error);
            msg = new MessageException(error.message, error);
        }
        switch (bubble.type) {
            case BubbleType.publish:
                this.bus.publishAsync(msg, { timeToDelay: new TimeSpan(delay) });
                break;
            case BubbleType.send:
                this.bus.sendAsync(msg, { timeToDelay: new TimeSpan(delay) });
                break;
            case BubbleType.sendReply:
                this.bus.sendWithReply(msg, { timeToDelay: new TimeSpan(delay) });
                break;
            case BubbleType.reply:
                context.replyAsync(msg);
                break;
            default:
                throw new Error("Unsupported bubble type: " + bubble.type);
        }
    }
    private initializeBus(): IBus {
        const bus = new Bus();
        bus.start();
        return bus;
    }

    private validateDefinition() {
        // Ensure each message has at least a type defined for it
        (this.messages || []).forEach(m => {
        });

        // Validate that every bubble has an associated definition
        this.bubbleFlow.forEach(b => {
            if (b.type === BubbleType.delay) {
                return;
            }

            const msg = this.getMessage(b.name);
            if (!msg) {
                throw new Error("Unable to locate a bubble definition for: " + b.name);
            }

            if (b.type !== BubbleType.reply && !msg.message["error"] && !(msg.message as any).type) {
                throw new Error(`[Bubble: ${b.name}] messages must have a type defined.`);
            }
        });
    }

    private extractMessageDefinitions(blockReader: TextBlockReader) {
        let workflowBlock;

        // skip any blank line and find the next real block
        while (!workflowBlock) {
            workflowBlock = blockReader.nextBlock;
        }

        const messageReader = new TextBlockReader(workflowBlock);
        let isNext = messageReader.next();
        while (isNext) {
            let message: any;
            const definition = messageReader.line;
            const name = definition.substring(0, definition.indexOf(":"));
            const jsonDefition = definition.substring(definition.indexOf(":") + 1);
            try {
                message = JSON.parse(jsonDefition);
            } catch (e) {
                throw new Error(`Unable to parse:\n${definition}\n\n${e}`);
            }
            const existingMessage = this.getMessage(name);
            if (existingMessage) {
                // merge definition with existing one
                existingMessage.message = Object.assign(existingMessage.message, message);
            } else {
                this.messages.push({ name, message });
            }
            isNext = messageReader.next();
        }
    }

    private getMessage(name: string): IBubbleMessage {
        const message = this.messages.filter(m => m.name === name)[0];
        return message
    }

    private getWorkflowDefinition(blockReader: TextBlockReader): any[] {
        let bubbleFlow: any[] = [];
        let capture: string;

        const workflowBlock = blockReader.nextBlock;

        for (let i = 0; i < workflowBlock.length; i++) {
            const char = workflowBlock[i];
            switch (char) {
                case "(":
                    const captureEnd = workflowBlock.indexOf(")", i + 1);
                    capture = workflowBlock.substring(i + 1, captureEnd);
                    i = captureEnd;
                    this.addBubble(capture, bubbleFlow);
                    break;
                case "-":
                    this.addDelay(bubbleFlow);
            }
        }
        return bubbleFlow;
    }

    private addBubble(bubbleDefinition: string, bubbleFlow: any[]) {
        // defaults
        let source = BubbleSource.generated;
        let type = BubbleType.send;

        let classifier = bubbleDefinition[0];
        if (classifier === "!") {
            source = BubbleSource.supplied;
            // strip first character off
            bubbleDefinition = bubbleDefinition.substr(1);
            classifier = bubbleDefinition[0];
        }

        let name = bubbleDefinition.substring(1);
        switch (classifier) {
            case ":":
                type = BubbleType.reply;
                break;
            case "*":
                type = BubbleType.publish;
                break;
            case ">":
                type = BubbleType.sendReply;
                break;
            default:
                name = bubbleDefinition;
        }
        bubbleFlow.push({ type, source, name });
    }

    private addDelay(bubbleFlow: IBubble[]) {
        const lastBubble = bubbleFlow[bubbleFlow.length - 1] as IDelayBubble;
        if (lastBubble.type === "delay") {
            lastBubble.delay += 10;
        } else {
            bubbleFlow.push({ type: BubbleType.delay, source: BubbleSource.supplied, delay: 10, name: "delay" } as IDelayBubble);
        }
    }


    /**
     * Returns a string highlighting the differences between the actual
     * and expected strings.
     *
     * @protected
     * @param {*} actual
     * @param {*} expected
     * @returns {string}
     * @memberof LiveDocReporter
     */
    protected createUnifiedDiff(actual, expected): string {
        var indent = '';
        const _this = this;
        function cleanUp(line) {
            if (line[0] === '+') {
                return indent + _this.colorTheme.statusPass(line);
            }
            if (line[0] === '-') {
                return indent + _this.colorTheme.statusFail(line);
            }
            if (line.match(/@@/)) {
                return '--';
            }
            if (line.match(/\\ No newline/)) {
                return null;
            }
            return indent + line;
        }
        function notBlank(line) {
            return typeof line !== 'undefined' && line !== null;
        }
        var msg = diff.createPatch('string', JSON.stringify(actual, null, 5), JSON.stringify(expected, null, 5));
        var lines = msg.split('\n').splice(5);
        return (
            '\n' +
            _this.colorTheme.statusPass('+ expected') +
            ' ' +
            _this.colorTheme.statusFail('- actual') +
            '\n\n' +
            lines
                .map(cleanUp)
                .filter(notBlank)
                .join('\n')
        );
    }

    private isMessageExceptionReply(message: IMessage<any>): boolean {
        return message.metaData.intent === Intents.reply
            && message.payload
            && typeof message.payload === "object"
            && message.payload.constructor.name === "MessageException"
    }
}

/*
  bubble|timeperiod|group
*/
export enum BubbleSource {
    supplied = "supplied",
    generated = "generated"
}

export enum BubbleType {
    publish = "publish",
    send = "sent",
    reply = "reply",
    sendReply = "sendReply",
    delay = "delay"
}

export class TextBlockReader {
    private arrayOfLines: string[];
    private currentIndex: number = -1;

    constructor(text: string) {
        // Split text into lines for processing
        this.arrayOfLines = text.split(/\r?\n/);
    }

    public get count() {
        return this.arrayOfLines.length;
    }

    public get line(): string {
        if (this.currentIndex < this.count) {
            const line = this.arrayOfLines[this.currentIndex];
            return (line || "").trim();
        } else {
            return null;
        }
    }

    public next(): boolean {
        this.currentIndex++;
        return this.currentIndex >= 0 && this.currentIndex < this.count;
    }


    public get nextBlock(): string {
        const lines = [];
        let isNext = this.next();
        while (isNext && (this.line && this.line.length > 0)) {
            lines.push(this.line);
            isNext = this.next();
        }

        return lines.join("\n");
    }

    public reset(): void {
        this.currentIndex = -1;
    }
}

export interface IBubbleMessage {
    name: string,
    message: any
}