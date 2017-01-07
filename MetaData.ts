import Hashtable from './hashtable'

export class MetaData extends Hashtable<any> {
    get messageType(): string { return this.item("messageType"); }
    get messageId(): string { return this.item("messageId"); }
    get conversationId(): string { return this.item("conversationId"); }
    get correlationId(): string { return this.item("correlationId"); }
    get replyTo(): string { return this.item("replyTo"); }
    get sagaKey(): string { return this.item("sagaKey"); }
    get shouldTerminatePipeline(): boolean { return !!(this.item("shouldTerminatePipeline")); }

    set messageType(messageType: string) { this.update("messageType", messageType); }
    set messageId(messageId: string) { this.update("messageId", messageId); }
    set conversationId(conversationId: string) { this.update("conversationId", conversationId); }
    set correlationId(correlationId: string) { this.update("correlationId", correlationId); }
    set replyTo(replyTo: string) { this.update("replyTo", replyTo); }
    set sagaKey(sagaKey: string) { this.update("sagaKey", sagaKey); }
    set shouldTerminatePipeline(shouldTerminatePipeline: boolean) { this.update("shouldTerminatePipeline", shouldTerminatePipeline.toString()); }
}