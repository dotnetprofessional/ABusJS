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
import { BubbleIntent } from "./BubbleIntent";
import { IDelayBubble } from "./IDelayBubble";
import { BubbleSource } from "./BubbleSource";
import { TextBlockReader } from "./TextBlockReader";
import * as diff from "diff";
import { Visualizations } from "./Visualizations";
import { IOverrideBubble } from "./IOverrideBubble";

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
        const bubbleFlow = this.bubbleFlow.filter(b => b.intent !== BubbleIntent.delay);

        for (let i = 0; i < this.actualMessageFlow.length; i++) {
            let actualMessage = this.actualMessageFlow[i];
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
                actual = this.trimToExpected(expected, { error: message.payload.message });
            } else {
                actual = this.trimToExpected(expected, message.payload);
            }
        } else if (message.type === MessageException.type) {
            // we maybe trying to validate an exception or there just may have been an
            // unexpected one so need to treat those differently
            if (!expected.type) {
                actual = this.trimToExpected(expected, { error: message.payload.message });
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
            if (this.tracingEnabled) { console.log(`BUBBLES: Received ${message.type}: ${Date.now() - this.offset}ms`); }

            // record that this message was sent to the bus
            this.actualMessageFlow.push(message);
            const bubble = this.bubbleFlow[this.bubbleFlowIndex];

            if (this.executionPromise.isComplete) {
                // flow is complete so
                return this.hasRegisteredHandler(message);
            }

            let messageHandled: boolean = false;

            switch (bubble.source) {
                case BubbleSource.substitute:
                    this.substituteMessage(bubble, context);
                    messageHandled = true;
                    break;
                case BubbleSource.override:
                    this.overrideMessage(bubble as IOverrideBubble, context);
                    messageHandled = true;
                    break;
            }

            // process the next message without blocking
            this.bubbleFlowIndex++;
            this.processNextMessageAsync(this.bubbleFlowIndex, message, context);
            // if the current message has a handler the bubbles won't handle it
            messageHandled = messageHandled || this.shouldHandleRequest(bubble, message);
            if (messageHandled) {
                message.metaData = message.metaData || {};
                (message.metaData as any).receivedBy = "Bubbles";
            }

            return messageHandled;
        } catch (e) {
            context.DoNotContinueDispatchingCurrentMessageToHandlers();
            this.executionPromise.reject(e);
        }
    }

    private async processNextMessageAsync(nextIndex: number, message: IMessage<any>, context: IMessageHandlerContext): Promise<void> {
        // this handles injection scenarios
        let delay: number;
        let nextMessageBubble = this.bubbleFlow[nextIndex];
        if (nextMessageBubble && nextMessageBubble.intent === BubbleIntent.delay) {
            delay = (nextMessageBubble as IDelayBubble).delay;
            nextIndex++;
            this.bubbleFlowIndex++;
            nextMessageBubble = this.bubbleFlow[nextIndex];
        }

        if (nextMessageBubble && nextMessageBubble.source === BubbleSource.inject) {
            // add any delay to the bubble definition
            if (delay) {
                nextMessageBubble.delay += delay;
            }
            this.injectMessage(nextMessageBubble, context);
        }

        // this message will come from the system or it could be a final delay in the definition
        this.resolveIfComplete(nextIndex, delay);
    }

    public enableTracing(): void {
        this.tracingEnabled = true;
    }

    private resolveIfComplete(index: number, delay: number = 10): void {
        if (this.isLastMessage(index)) {
            this.completeFlow(delay);
        }
    }

    private isLastMessage(index: number): boolean {
        return index >= this.bubbleFlow.length;
    }

    private shouldHandleRequest(bubble: IBubble, message: IMessage<any>): boolean {
        const hasHandler = this.hasRegisteredHandler(message);
        const shouldHandle = !hasHandler;

        if (shouldHandle && this.tracingEnabled) {
            console.log(`BUBBLES: handled: ${bubble.name}`);
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

        // 3. Add any synthetic messages which are needed for substitutions
        this.addSyntheticMessages();
    }

    private addSyntheticMessages(): void {
        for (let i = 0; i < this.bubbleFlow.length; i++) {
            const bubble = this.bubbleFlow[i];
            if (bubble.name.endsWith(".original")) {
                // find message 
                const m = this.getBubbleMessage(bubble.name.substr(0, bubble.name.indexOf(".original")));
                // add a synthetic message
                this.messages.push({ name: bubble.name, message: { type: m.message.type } });
            }
        }
    }

    private async executeBubbleFlowAsync(): Promise<void> {
        try {
            const firstBubble: IBubble = this.bubbleFlow[0];

            // verify that the first message is defined as inject
            if (firstBubble.source === BubbleSource.system) {
                throw Error("The first bubble must be prefixed with ! ie (!request)");
            }
            this.injectMessage(firstBubble, null);
        } catch (e) {
            this.executionPromise.reject(e);
        }
    }

    private injectMessage(bubble: IBubble, context: IMessageHandlerContext): void {
        if (this.tracingEnabled) console.log(`BUBBLES: injected: ${bubble.name}`);
        const bubbleMessage = this.getBubbleMessage(bubble.name).message;

        this.dispatchMessage(bubble, bubbleMessage, context);
    }

    private overrideMessage(bubble: IOverrideBubble, context: IMessageHandlerContext): void {

        // dispatch as many responses as defined by the bubble
        bubble.overrideWith.forEach(override => {
            if (this.tracingEnabled) console.log(`BUBBLES: overridden: ${bubble.name} with ${override.name}`);
            const bubbleMessage = this.getBubbleMessage(override.name).message;
            // as this is being handled by the bubbles library add an identifier proving that
            this.dispatchMessage(override, bubbleMessage, context);
        });
    }

    private substituteMessage(bubble: IBubble, context: IMessageHandlerContext): void {
        if (this.tracingEnabled) console.log(`BUBBLES: substituted: ${bubble.name} for type: ${context.activeMessage.type}`);
        bubble = this.bubbleFlow[this.bubbleFlowIndex + 1];
        const bubbleMessage = this.getBubbleMessage(bubble.name).message;

        this.dispatchMessage(bubble, bubbleMessage, context);
    }

    private dispatchMessage(bubble: IBubble, message: any, context: IMessageHandlerContext): void {
        context = context || new MessageHandlerContext(this.bus, null, null);

        let options: SendOptions;
        if (bubble.delay) {
            options = { timeToDelay: new TimeSpan(bubble.delay) };
        }

        // make a copy of the message before dispatching it if its an object
        if (typeof message === "object") {
            message = Object.assign({}, message);
            message.metaData = message.metaData || {};
            (message.metaData as any).sentBy = "Bubbles";
        }
        switch (bubble.intent) {
            case BubbleIntent.publish:
                this.executeWithDelay(() => context.publishAsync(message), options);
                break;
            case BubbleIntent.send:
                this.executeWithDelay(() => context.sendAsync(message), options);
                break;
            case BubbleIntent.sendReply:
                this.executeWithDelay(async () => {
                    try {
                        await context.sendWithReplyAsync(message);
                    } catch (e) {
                        // ignore any errors as they will be intercepted but a promise rejection may still occur
                        debugger;
                    }
                }, options);
                break;
            case BubbleIntent.reply:
                // replies don't inheritably support delays but for testing this may be useful to simulate delays
                this.executeWithDelay(() => context.replyAsync(message), options);
                break;
            default:
                throw new Error("Unsupported bubble intent: " + bubble.intent);
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
            if (b.intent === BubbleIntent.delay) {
                return;
            }

            const msg = this.getBubbleMessage(b.name);
            if (!msg) {
                throw new Error("Unable to locate a bubble definition for: " + b.name);
            }

            if (b.intent !== BubbleIntent.reply && !msg.message.error && !(msg.message as any).type) {
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
                if (typeof existingMessage.message === "string") {
                    throw Error(`Definition: ${definition}\nUnable to merge strings, must be an object`);
                }
                existingMessage.message = Object.assign(existingMessage.message, message);
            } else {
                this.messages.push({ name, message });
            }
            isNext = messageReader.next();
        }
    }

    private getBubbleMessage(name: string): IBubbleMessage {
        const message: IBubbleMessage = this.messages.filter(m => m.name === name)[0];
        // make a copy so the original is not modified
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

    private addDelay(bubbleFlow: IBubble[]): void {
        const lastBubble = bubbleFlow[bubbleFlow.length - 1] as IDelayBubble;
        if (lastBubble.intent === BubbleIntent.delay) {
            lastBubble.delay += 10;
        } else {
            bubbleFlow.push({ intent: BubbleIntent.delay, source: BubbleSource.inject, delay: 10, name: "delay" } as IDelayBubble);
        }
    }

    private addBubble(bubbleDefinition: string, bubbleFlow: IBubble[]): void {
        let bubble: IBubble;
        bubble = this.getBubble(bubbleDefinition);
        if (bubble.name.startsWith(":")) {
            // substitution  - strip off the : from the name
            bubble.name = bubble.name.substr(1);
            bubble.source = BubbleSource.substitute;
            // as there will be two messages being captured there needs to be an additional bubble to account for that
            const originalType = bubble.name + ".original";
            bubbleFlow.push({ name: originalType, intent: bubble.intent, source: bubble.source, delay: 0 });
            bubble.source = BubbleSource.system;
            bubbleFlow.push(bubble);
        } else if (bubble.name.indexOf(":") > 0) {
            // override
            this.addOverrideBubble(bubbleDefinition, bubbleFlow);
        } else {
            bubble = this.getBubble(bubbleDefinition);
            bubbleFlow.push(bubble);
        }
    }

    private addOverrideBubble(bubbleDefinition: string, bubbleFlow: IBubble[]): void {
        // this is an override definition
        const responses: IBubble[] = [];
        const parts = bubbleDefinition.split(":");

        const requestBubble = this.getBubble(parts[0]);
        if (requestBubble.source !== BubbleSource.inject) {
            throw Error(`Bubble: ${requestBubble.name}\nExpected bubble to start with '!', did you mean (A)(B)?`);
        }
        requestBubble.source = BubbleSource.override;

        for (let i = 1; i < parts.length; i++) {
            responses.push(this.getBubble(parts[i]));
        }

        bubbleFlow.push({ ...requestBubble, overrideWith: responses } as IOverrideBubble);
        responses.forEach(r => {
            bubbleFlow.push(r);
        });
    }

    private getBubble(bubbleDefinition: string): IBubble {
        // javascript doesn't seem to support named groups, so this is the original to make it clearer what the RegEx is doing
        // this should be kept updated if the real regex is modified.
        // /^(?<inject>[!]?)(?<delay>[-]*)(?<intent>[>*@]?)(?<name>\S*)/g
        const regex = /^([!]?)([-]*)([>*@]?)(\S*)/g;

        const match: RegExpExecArray = regex.exec(bubbleDefinition);
        const source: BubbleSource = match[1] === "!" ? BubbleSource.inject : BubbleSource.system;
        const delay: number = match[2].length * 10;
        const intent: BubbleIntent = this.mapIntent(match[3]);
        const name: string = match[4];

        return {
            name,
            intent,
            source,
            delay
        };
    }

    private mapIntent(symbol: string): BubbleIntent {
        switch (symbol) {
            case "":
                return BubbleIntent.send;
            case "*":
                return BubbleIntent.publish;
            case "-":
                return BubbleIntent.delay;
            case ">":
                return BubbleIntent.sendReply;
            case "@":
                return BubbleIntent.reply;
            default:
                throw Error("Unknown intent symbol: " + symbol);
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
        var msg: string = diff.createPatch("string", JSON.stringify(actual, null, 5), JSON.stringify(expected, null, 5), "", "");
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

