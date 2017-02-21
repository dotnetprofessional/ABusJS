import Hashtable from './Hashtable'

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

    public set messageType(messageType: string) { this.update("messageType", messageType); }
    public set intent(intent: Intents) { this.update("intent", intent); }
    public set messageId(messageId: string) { this.update("messageId", messageId); }
    public set conversationId(conversationId: string) { this.update("conversationId", conversationId); }
    public set correlationId(correlationId: string) { this.update("correlationId", correlationId); }
    public set replyTo(replyTo: string) { this.update("replyTo", replyTo); }
    public set sagaKey(sagaKey: string) { this.update("sagaKey", sagaKey); }
    public set dequeueCount(sagaKey: number) { this.update("sagaKey", sagaKey); }
    public set subscription(subscription: string) { this.update("subscription", subscription); }
    public set shouldTerminatePipeline(shouldTerminatePipeline: boolean) { this.update("shouldTerminatePipeline", shouldTerminatePipeline.toString()); }
}

export enum Intents {
    send,
    publish,
    reply,
}