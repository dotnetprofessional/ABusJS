import {IMessageHandlerContext} from './IMessageHandlerContext'
import {MetaData} from './MetaData'
import {IMessage} from './IMessage' 
import {Bus} from './ABus'
import {SendOptions} from './SendOptions'

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
        this.bus.publishInternal(message, new MessageHandlerContext(this.bus, this.metaData));
    }

    send<T>(message: IMessage<T>, options?: SendOptions): Promise<any> {
        return this.bus.sendInternal(message, options, new MessageHandlerContext(this.bus, this.metaData));
    }

    reply<T>(reply: T): void {
        var msg = { type: this.messageType + ".reply", message: reply };
        this.bus.publishInternal(msg, new MessageHandlerContext(this.bus, this.metaData));
    }
}