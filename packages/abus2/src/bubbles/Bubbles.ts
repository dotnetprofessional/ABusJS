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
import { IMessageSubscription } from "../IMessageSubscription";
import { SendOptions } from "../SendOptions";
import { MessageHandlerContext } from "../MessageHandlerContext";

export interface IColorTheme {
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
    public actualMessageFlow: IMessage<any>[] = [];
    private bubbleFlow: IBubble[];
    private bubbleFlowIndex: number = 0;
    private tracingEnabled: boolean;
    private executionPromise: { isComplete: boolean, resolve: any, reject: any };
    protected colorTheme: IColorTheme = { statusFail: chalk.redBright, statusPass: chalk.greenBright };

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
            .useTransportMessageReceivedTasks(new BubblesTask(this));
        // .andAlso()
        // .inboundPipeline.useTransportMessageReceivedTasks(new DebugLoggingTask("inbound:")).andAlso()
        // .outboundPipeline.useTransportMessageReceivedTasks(new DebugLoggingTask("outbound:"));

    }

    public async executeAsync(workflow: string, messages: IBubbleMessage[] = []): Promise<void> {
        // ensure we have a workflow being passed in
        if (!workflow) {
            throw new Error("No workflow definition defined");
        }

        const promise: Promise<void> = new Promise(async (resolve, reject) => {
            try {
                this.executionPromise = { resolve, reject, isComplete: false };
                this.messages = messages;
                this.processWorkflowDefinition(workflow);
                this.validateDefinition();

                // 3. Execute workflow/bubble flow
                this.executeBubbleFlowAsync();
            } catch (e) {
                reject(e);
            }
        });

        return promise;
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
            // We maybe trying to validate an exception or there just may have been an 
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
        // remove all the delay bubbles before comparing
        const bubbleFlow = this.bubbleFlow.filter(b => b.type !== BubbleType.delay);

        for (let i = 0; i < this.actualMessageFlow.length; i++) {
            const actualMessage = this.actualMessageFlow[i];
            let expectedBubble = bubbleFlow[i];
            if (!expectedBubble) {
                let errorMessage: string = `bubble: extra!!, message index: ${i}\n`;
                if (actualMessage.type === MessageException.type) {
                    errorMessage += `\n${MessageException.type}:${actualMessage.payload.description}`;
                }
                errorMessage
                throw new Error(errorMessage);
            }
            const expectedMessage = this.getBubbleMessage(expectedBubble.name).message;
            const bubbleResult = this.validateResult(expectedMessage, actualMessage, expectedBubble);
            this.bubbleFlowResult.push({ bubble: expectedBubble, actual: actualMessage, expected: expectedMessage.message, result: bubbleResult });

            if (!bubbleResult.isValid) {
                let errorMessage: string = `bubble: ${expectedBubble.name}, message index: ${i}\n${bubbleResult.diff}`;
                if (actualMessage.type === MessageException.type) {
                    errorMessage += `\n${MessageException.type}:${actualMessage.payload.error}`;
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
            let event: string;
            if (actual.metaData.intent === Intents.reply) {
                actual.metaData.receivedBy = this.getParentIdentifier(this.getParentBubble(bubble));
                event = `${parentProcessIdentifier} -.-> |${actual.type}| ${actual.metaData.receivedBy || "unhandled"}`;
            } else {
                event = `${parentProcessIdentifier} --> |${actual.type}| ${actual.metaData.receivedBy || "unhandled"}`;
            }

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
            // at this point can add syles too
            if (actual.metaData.intent === Intents.reply) {
                actual.metaData.receivedBy = this.getParentIdentifier(this.getParentBubble(bubble));
                event = `${parentProcessIdentifier}-->>${actual.metaData.receivedBy || "unhandled"}:${actual.type}`;
            } else {
                event = `${parentProcessIdentifier}->>${actual.metaData.receivedBy || "unhandled"}:${actual.type}`;

            }

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

    private offset = Date.now();

    public async messageHandlerAsync(message: IMessage<any>, context: IMessageHandlerContext): Promise<boolean> {
        try {
            if (this.tracingEnabled) console.info(`BUBBLES: Received ${message.type}: ${Date.now() - this.offset}ms`);

            this.actualMessageFlow.push(message);

            if (message.type === "GetAgreementHeadersRequest") {
                debugger;
            }

            // work out the basics of this message
            const handleMessage = this.shouldHandleRequest(message);

            const processNextMessageAsync = async (nextIndex: number, message: IMessage<any>, context: IMessageHandlerContext) => {
                let delay: number;
                let nextMessageBubble = this.bubbleFlow[nextIndex];
                if (nextMessageBubble && nextMessageBubble.type === BubbleType.delay) {
                    delay = (nextMessageBubble as IDelayBubble).delay;
                    nextIndex++;
                    this.bubbleFlowIndex++;
                    nextMessageBubble = this.bubbleFlow[nextIndex];
                }
                if (nextMessageBubble && nextMessageBubble.source === BubbleSource.supplied) {
                    this.handleBubbleMessage(nextMessageBubble, context, delay);
                } else {
                    // this message will come from the system or it could be a final delay in the definition
                    if (this.isLastMessage(nextIndex)) {
                        this.completeFlow(delay);
                    }
                }
            };

            // process the next message without blocking
            this.bubbleFlowIndex++;
            processNextMessageAsync(this.bubbleFlowIndex, message, context);
            // if the current message has a handler the bubbles won't handle it
            return handleMessage;
        } catch (e) {
            context.DoNotContinueDispatchingCurrentMessageToHandlers();
            this.executionPromise.reject(e);
        }
    }


    //     if (message.type === "SAGA_STARTED") {
    //         debugger;
    //     }

    //     if (this.executionPromise.isComplete) {
    //         return true;
    //     }
    //     this.bubbleFlowIndex++;


    //     // determine if this message should be auto handled
    //     let nextBubble = this.bubbleFlow[this.bubbleFlowIndex];
    //     const nextNextBubble = this.bubbleFlow[this.bubbleFlowIndex + 1];
    //     let delay: number = 0;
    //     if (nextBubble && nextBubble.type === BubbleType.delay) {
    //         this.bubbleFlowIndex++;
    //         delay = (nextBubble as IDelayBubble).delay;
    //         nextBubble = nextNextBubble;
    //     }

    //     // Are we at the end yet???
    //     if (this.handleEndIfEndOfFlow(message, delay)) {
    //         // is the next next bubble one that bubbles needs to handle too? (ie if we don't we may never get another message and timeout)

    //         if (this.tracingEnabled) console.log(`BUBBLES: handled type: ${message.type}`);
    //         return true;
    //     }

    //     if (nextBubble && (nextBubble.source === BubbleSource.supplied)) {

    //         this.handleBubbleMessage(nextBubble, context, delay);
    //         return nextBubble.type === BubbleType.reply;
    //     } else {
    //         const willHandle = this.handleEndIfEndOfFlow(message, delay);
    //         if (this.tracingEnabled && willHandle) console.log(`BUBBLES: handled type: ${message.type}`);
    //     }
    // } catch (e) {
    //     context.DoNotContinueDispatchingCurrentMessageToHandlers();
    //     this.executionPromise.reject(e);
    // }


    public enableTracing() {
        this.tracingEnabled = true;
    }

    private isLastMessage(index: number): boolean {
        return index >= this.bubbleFlow.length;
    }

    private shouldHandleRequest(message: IMessage<any>) {
        const currentBubble = this.bubbleFlow[this.bubbleFlowIndex];
        const nextBubble = this.bubbleFlow[this.bubbleFlowIndex + 1];

        let shouldHandle: boolean;
        if (nextBubble && nextBubble.type === BubbleType.reply && nextBubble.source === BubbleSource.supplied) {
            shouldHandle = true;
        }
        shouldHandle = shouldHandle || (currentBubble.type !== BubbleType.reply && currentBubble.source === BubbleSource.supplied)
            || !this.hasRegisteredHandler(message);

        if (shouldHandle && this.tracingEnabled) {
            console.log(`BUBBLES: handled type: ${message.type}`);
        }
        return shouldHandle;
    }

    private hasRegisteredHandler(message: IMessage<any>) {
        // accessing private state - but we need it!!
        if (message.metaData.intent === Intents.reply) {
            // Validate that there's a registered handler for this reply
            const replySubscription = (this.bus as any).messageReplyHandlers[message.metaData.replyTo];
            return !!replySubscription;
        } else {
            const subscriptions = (this.bus as any).messageSubscriptions as IMessageSubscription<any>[];
            return subscriptions && subscriptions.filter(s => s.messageFilter === message.type).length > 0;
        }
    }

    private completeFlow(delay: number = 0) {
        setTimeout(() => {
            this.executionPromise.isComplete = true;
            this.executionPromise.resolve();
        }, delay);
    }
    // private handleEndIfEndOfFlow(message: IMessage<any>, delay: number = 0): boolean {
    //     if (this.bubbleFlowIndex >= this.bubbleFlow.length) {
    //         const hasHandler = this.hasRegisteredHandler(message);
    //         // delay the resolution of the promise so that the handler has a chance to execute if available
    //         setTimeout(() => {
    //             this.executionPromise.isComplete = true;
    //             this.executionPromise.resolve();
    //         }, delay);
    //         return !hasHandler;
    //     } else {
    //         return !this.hasRegisteredHandler(message);
    //     }
    // }

    private processWorkflowDefinition(workflow: string) {
        const blockReader = new TextBlockReader(workflow);

        // 1. get the message flow from the definition
        this.bubbleFlow = this.getWorkflowDefinition(blockReader);

        // 2. get any messages that have been defined
        this.extractMessageDefinitions(blockReader);
    }

    private async executeBubbleFlowAsync(): Promise<void> {
        try {
            const firstBubble = this.bubbleFlow[0];

            this.handleBubbleMessage(firstBubble);
        } catch (e) {
            this.executionPromise.reject(e);
        }
    }

    private handleBubbleMessage(bubble: IBubble, context?: IMessageHandlerContext, delay?: number) {
        let bubbleMessage: any;
        bubbleMessage = this.getBubbleMessage(bubble.name).message;
        if (bubble.type !== BubbleType.reply) {
            bubbleMessage = Object.assign({}, bubbleMessage);
        }

        context = context || new MessageHandlerContext(this.bus, null, null);
        if (bubbleMessage.error) {
            // this is an error so we need to convert it to a bus exception
            const error = new Error(bubbleMessage.error);
            bubbleMessage = new MessageException(error.message, error);
        }
        let options: SendOptions;
        if (delay) {
            options = { timeToDelay: new TimeSpan(delay) };
        }

        switch (bubble.type) {
            case BubbleType.publish:
                this.executeWithDelay(() => context.publishAsync(bubbleMessage), options);
                break;
            case BubbleType.send:
                this.executeWithDelay(() => context.sendAsync(bubbleMessage), options);
                break;
            case BubbleType.sendReply:
                this.executeWithDelay(() => context.sendWithReply(bubbleMessage), options);
                break;
            case BubbleType.reply:
                // replies don't inheritably support delays but for testing this may be useful to simulate delays
                this.executeWithDelay(() => context.replyAsync(bubbleMessage), options);
                break;
            default:
                throw new Error("Unsupported bubble type: " + bubble.type);
        }
    }

    private executeWithDelay(f: Function, options: SendOptions) {
        if (options && options.timeToDelay) {
            setTimeout(() => f(), options.timeToDelay.totalMilliseconds);
        } else {
            f();
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

            const msg = this.getBubbleMessage(b.name);
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
            const existingMessage = this.getBubbleMessage(name);
            if (existingMessage) {
                // merge definition with existing one
                existingMessage.message = Object.assign(existingMessage.message, message);
            } else {
                this.messages.push({ name, message });
            }
            isNext = messageReader.next();
        }
    }

    private getBubbleMessage(name: string): IBubbleMessage {
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