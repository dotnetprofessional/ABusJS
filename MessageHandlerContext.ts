import { IMessageHandlerContext } from './IMessageHandlerContext'
import { MetaData } from './MetaData'
import { IMessage } from './IMessage'
import { Bus } from './ABus'
import { SendOptions } from './SendOptions'

export class MessageHandlerContext implements IMessageHandlerContext {
    constructor(public bus: Bus, public metaData: MetaData = new MetaData()) {
    }

    get messageType(): string { return this.metaData.messageType; }
    get messageId(): string { return this.metaData.messageId; }
    get shouldTerminatePipeline(): boolean { return this.metaData.shouldTerminatePipeline; }
    get replyTo(): string { return this.metaData.replyTo; }
    get sagaKey(): string { return this.metaData.sagaKey; }

    getMetaDataValue<T>(key: string): T {
        if (this.metaData.contains(key)) {
            return this.metaData.item(key);
        } else {
            return undefined;
        }
    }

    setMetaDataValue(key: string, value: any) {
        this.metaData.update(key, value);
    }

    publish<T>(message: IMessage<T>): void {
        this.bus.publishInternal(message, new SendOptions(), this);
    }

    sendAsync<T>(message: IMessage<T>, options?: SendOptions): Promise<any> {
        return this.bus.sendInternalAsync(message, options, this);
    }

    reply<T>(reply: T): void {
        var msg = { type: this.messageType + ".reply", message: reply } as IMessage<any>;
        msg.metaData = new MetaData();
        // Need to add a replyTo so it can be delivered to the correct handler
        msg.metaData.replyTo = this.metaData.messageId;
        // Here a publish is used instead of a send as only a publish supports wild card subscriptions
        // this is needed by the Bus to subscribe to all reply messages ie *.reply 
        this.bus.publishInternal(msg, new SendOptions(), this);
    }
}