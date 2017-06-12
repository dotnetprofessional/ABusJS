import Hashtable from './Hashtable';

export class MetaData extends Hashtable<any> {
    public get messageType(): string { return this.item("messageType"); }
    public get intent(): Intents { return this.item("intent"); }
    public get messageId(): string { return this.item("messageId"); }
    public get conversationId(): string { return this.item("conversationId"); }
    public get correlationId(): string { return this.item("correlationId"); }
    public get replyTo(): string { return this.item("replyTo"); }
    public get sagaKey(): string { return this.item("sagaKey"); }
    public get dequeueCount(): number { return this.item("dequeueCount"); }
    public get subscription(): string { return this.item("subscription"); }
    public get shouldTerminatePipeline(): boolean { return !!(this.item("shouldTerminatePipeline")); }
    public get timestamp(): number { return this.item("timestamp"); }
    public get startProcessing(): number { return this.item("startProcessing"); }
    public get endProcessing(): number { return this.item("endProcessing"); }
    public get deliverAt(): number { return this.item("deliverAt"); }

    /** @internal  */
    public set messageType(messageType: string) { this.update("messageType", messageType); }
    /** @internal  */
    public set intent(intent: Intents) { this.update("intent", intent); }
    /** @internal  */
    public set messageId(messageId: string) { this.update("messageId", messageId); }
    /** @internal  */
    public set conversationId(conversationId: string) { this.update("conversationId", conversationId); }
    /** @internal  */
    public set correlationId(correlationId: string) { this.update("correlationId", correlationId); }
    /** @internal  */
    public set replyTo(replyTo: string) { this.update("replyTo", replyTo); }
    public set sagaKey(sagaKey: string) { this.update("sagaKey", sagaKey); }
    /** @internal  */
    public set dequeueCount(sagaKey: number) { this.update("sagaKey", sagaKey); }
    /** @internal  */
    public set subscription(subscription: string) { this.update("subscription", subscription); }
    public set shouldTerminatePipeline(shouldTerminatePipeline: boolean) { this.update("shouldTerminatePipeline", shouldTerminatePipeline.toString()); }

    public set startProcessing(startProcessing: number) { this.update("startProcessing", startProcessing); }
    public set endProcessing(endProcessing: number) { this.update("endProcessing", endProcessing); }
}

export enum Intents {
    send,
    publish,
    reply,
}