import Hashtable from './Hashtable'

export class MetaData extends Hashtable<any> {
    get messageType(): string { return this.item("messageType"); }
    get intent(): Intents { return this.item("intent"); }
    get messageId(): string { return this.item("messageId"); }
    get conversationId(): string { return this.item("conversationId"); }
    get correlationId(): string { return this.item("correlationId"); }
    get replyTo(): string { return this.item("replyTo"); }
    get sagaKey(): string { return this.item("sagaKey"); }
    get dequeueCount(): number { return this.item("dequeueCount"); }
    get subscription(): string { return this.item("subscription"); }
    get shouldTerminatePipeline(): boolean { return !!(this.item("shouldTerminatePipeline")); }

    set messageType(messageType: string) { this.update("messageType", messageType); }
    set intent(intent: Intents) { this.update("intent", intent); }
    set messageId(messageId: string) { this.update("messageId", messageId); }
    set conversationId(conversationId: string) { this.update("conversationId", conversationId); }
    set correlationId(correlationId: string) { this.update("correlationId", correlationId); }
    set replyTo(replyTo: string) { this.update("replyTo", replyTo); }
    set sagaKey(sagaKey: string) { this.update("sagaKey", sagaKey); }
    set dequeueCount(sagaKey: number) { this.update("sagaKey", sagaKey); }
    set subscription(subscription: string) { this.update("subscription", subscription); }
    set shouldTerminatePipeline(shouldTerminatePipeline: boolean) { this.update("shouldTerminatePipeline", shouldTerminatePipeline.toString()); }
}

export enum Intents {
    send,
    publish,
    reply,
}