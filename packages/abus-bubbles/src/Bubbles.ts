import { IBubbleMessage } from "./IBubbleMessage";
import { IBubbleFlowResult } from "./IBubbleFlowResult";
import {
    IMessage, IBus, MessageTracingTask, Intents, IMessageHandlerContext, MessageHandlerContext,
    SendOptions, TimeSpan, Bus, MessageException, IMessageSubscription, MessagePerformanceTask
} from "abus2";
import { IBubble } from "./IBubble";
import { IColorTheme } from "./IColorTheme";
import chalk from "chalk";
import { BubblesTask } from "./BubblesTask";
import { IBubbleResult } from "./IBubbleResult";
import { BubbleType } from "./BubbleType";
import { IDelayBubble } from "./IDelayBubble";
import { BubbleSource } from "./BubbleSource";
import { TextBlockReader } from "./TextBlockReader";
import diff from "diff";
import { Visualizations } from "./Visualizations";

export class Bubbles {
    private messages: IBubbleMessage[];
    private bubbleFlowResult: IBubbleFlowResult[] = [];
    private actualMessageFlow: IMessage<any>[] = [];
    private bubbleFlow: IBubble[];
    private bubbleFlowIndex: number = 0;
    private tracingEnabled: boolean;
    private executionPromise: { isComplete: boolean, resolve: any, reject: any };
    protected colorTheme: IColorTheme = { statusFail: chalk.redBright, statusPass: chalk.greenBright };
    public visualizations: Visualizations = new Visualizations(this);

    constructor(public bus?: IBus) {
        if (!bus) {
            this.bus = this.initializeBus();
        }

        // add the bubbles task to the bus pipeline. This needs to be the outbound pipeline
        // as for transports that go off device you won't get access to the inbound pipeline
        // tODO: This needs to be applied to all transports defined
        this.bus.usingRegisteredTransportToMessageType("*")
            .outboundPipeline
            .useLocalMessagesReceivedTasks(new MessageTracingTask()).and
            .useTransportMessageReceivedTasks(new BubblesTask(this))
            .andAlso()
            .outboundPipeline.useTransportMessageReceivedTasks(new MessagePerformanceTask);
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
                errorMessage;
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

    public observedMessages(): IMessage<any>[] {
        return this.actualMessageFlow;
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
                actual = this.trimToExpected(expected, { error: message.payload.description });
            } else {
                actual = this.trimToExpected(expected, message.payload);
            }
        } else if (message.type === MessageException.type) {
            // we maybe trying to validate an exception or there just may have been an
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
        const match: boolean = JSON.stringify(expected) === JSON.stringify(actual);
        if (!match) {
            diff = this.createUnifiedDiff(actual, expected);
        }
        return { isValid: match, diff };
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
                    // this handles simply string types such as replies
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
        };

        return copy(expected, actual);
    }

    private offset = Date.now();

    public async messageHandlerAsync(message: IMessage<any>, context: IMessageHandlerContext): Promise<boolean> {
        try {
            if (this.tracingEnabled) { console.info(`BUBBLES: Received ${message.type}: ${Date.now() - this.offset}ms`); }

            this.actualMessageFlow.push(message);

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

    public enableTracing(): void {
        this.tracingEnabled = true;
    }

    private isLastMessage(index: number): boolean {
        return index >= this.bubbleFlow.length;
    }

    private shouldHandleRequest(message: IMessage<any>): boolean {
        const nextBubble = this.bubbleFlow[this.bubbleFlowIndex + 1];

        let shouldHandle: boolean;
        if (nextBubble && nextBubble.type === BubbleType.reply && nextBubble.source === BubbleSource.supplied) {
            shouldHandle = true;
        }
        shouldHandle = shouldHandle || !this.hasRegisteredHandler(message);

        if (shouldHandle && this.tracingEnabled) {
            console.log(`BUBBLES: handled type: ${message.type}`);
        }
        return shouldHandle;
    }

    private hasRegisteredHandler(message: IMessage<any>): boolean {
        // accessing private state - but we need it!!
        if (message.metaData.intent === Intents.reply) {
            // validate that there's a registered handler for this reply
            const replySubscription = (this.bus as any).messageReplyHandlers[message.metaData.replyTo];
            return !!replySubscription;
        } else {
            const subscriptions = (this.bus as any).messageSubscriptions as IMessageSubscription<any>[];
            return subscriptions && subscriptions.filter(s => s.messageFilter === message.type).length > 0;
        }
    }

    private completeFlow(delay: number = 0): void {
        setTimeout(() => {
            this.executionPromise.isComplete = true;
            this.executionPromise.resolve();
        }, delay);
    }

    private processWorkflowDefinition(workflow: string): void {
        const blockReader: TextBlockReader = new TextBlockReader(workflow);

        // 1. get the message flow from the definition
        this.bubbleFlow = this.getWorkflowDefinition(blockReader);

        // 2. get any messages that have been defined
        this.extractMessageDefinitions(blockReader);
    }

    private async executeBubbleFlowAsync(): Promise<void> {
        try {
            const firstBubble: IBubble = this.bubbleFlow[0];

            this.handleBubbleMessage(firstBubble);
        } catch (e) {
            this.executionPromise.reject(e);
        }
    }

    private handleBubbleMessage(bubble: IBubble, context?: IMessageHandlerContext, delay?: number): void {
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

    private executeWithDelay(f: Function, options: SendOptions): void {
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

    private validateDefinition(): void {
        // validate that every bubble has an associated definition
        this.bubbleFlow.forEach(b => {
            if (b.type === BubbleType.delay) {
                return;
            }

            const msg = this.getBubbleMessage(b.name);
            if (!msg) {
                throw new Error("Unable to locate a bubble definition for: " + b.name);
            }

            if (b.type !== BubbleType.reply && !msg.message.error && !(msg.message as any).type) {
                throw new Error(`[Bubble: ${b.name}] messages must have a type defined.`);
            }
        });
    }

    private extractMessageDefinitions(blockReader: TextBlockReader): void {
        let workflowBlock: string;

        // skip any blank line and find the next real block
        while (!workflowBlock) {
            workflowBlock = blockReader.nextBlock;
        }

        const messageReader: TextBlockReader = new TextBlockReader(workflowBlock);
        let isNext: boolean = messageReader.next();
        while (isNext) {
            let message: any;
            const definition: string = messageReader.line;
            const name: string = definition.substring(0, definition.indexOf(":"));
            const jsonDefinition: string = definition.substring(definition.indexOf(":") + 1);
            try {
                message = JSON.parse(jsonDefinition);
            } catch (e) {
                throw new Error(`Unable to parse:\n${definition}\n\n${e}`);
            }
            const existingMessage: IBubbleMessage = this.getBubbleMessage(name);
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
        const message: IBubbleMessage = this.messages.filter(m => m.name === name)[0];
        return message;
    }

    private getWorkflowDefinition(blockReader: TextBlockReader): any[] {
        let bubbleFlow: any[] = [];
        let capture: string;

        const workflowBlock: string = blockReader.nextBlock;

        for (let i = 0; i < workflowBlock.length; i++) {
            const char = workflowBlock[i];
            switch (char) {
                case "(":
                    const captureEnd: number = workflowBlock.indexOf(")", i + 1);
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

    private addBubble(bubbleDefinition: string, bubbleFlow: any[]): void {
        // defaults
        let source: BubbleSource = BubbleSource.generated;
        let type: BubbleType = BubbleType.send;

        let classifier: string = bubbleDefinition[0];
        if (classifier === "!") {
            source = BubbleSource.supplied;
            // strip first character off
            bubbleDefinition = bubbleDefinition.substr(1);
            classifier = bubbleDefinition[0];
        }

        let name: string = bubbleDefinition.substring(1);
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

    private addDelay(bubbleFlow: IBubble[]): void {
        const lastBubble: IDelayBubble = bubbleFlow[bubbleFlow.length - 1] as IDelayBubble;
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
    protected createUnifiedDiff(actual: any, expected: any): string {
        var indent: string = "";
        const _this: any = this;
        function cleanUp(line: string): string {
            if (line[0] === "+") {
                return indent + _this.colorTheme.statusPass(line);
            }
            if (line[0] === "-") {
                return indent + _this.colorTheme.statusFail(line);
            }
            if (line.match(/@@/)) {
                return "--";
            }
            if (line.match(/\\ No newline/)) {
                return null;
            }
            return indent + line;
        }
        function notBlank(line: string): boolean {
            return typeof line !== "undefined" && line !== null;
        }
        var msg: string = diff.createPatch("string", JSON.stringify(actual, null, 5), JSON.stringify(expected, null, 5));
        var lines: string[] = msg.split("\n").splice(5);
        return (
            "\n" +
            _this.colorTheme.statusPass("+ expected") +
            " " +
            _this.colorTheme.statusFail("- actual") +
            "\n\n" +
            lines
                .map(cleanUp)
                .filter(notBlank)
                .join("\n")
        );
    }

    private isMessageExceptionReply(message: IMessage<any>): boolean {
        return message.metaData.intent === Intents.reply
            && message.payload
            && typeof message.payload === "object"
            && message.payload.constructor.name === "MessageException";
    }
}

