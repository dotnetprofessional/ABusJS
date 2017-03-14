import { MetaData } from './MetaData'
import { IMessage } from './IMessage'
import { Bus } from './Bus'
import { SendOptions } from './SendOptions'

/**
 * Provides additional data about the current message, it also supports
 * the ability to link incoming messages with outgoing messages when
 * using the context methods for sending an publishing.
 *
 * @export
 * @class MessageHandlerContext
 * @implements {IMessageHandlerContext}
 */
export class MessageHandlerContext {
    constructor(public bus: Bus, public metaData: MetaData = new MetaData()) {
    }

    public get messageType(): string { return this.metaData.messageType; }
    public get messageId(): string { return this.metaData.messageId; }
    public get shouldTerminatePipeline(): boolean { return this.metaData.shouldTerminatePipeline; }
    public get replyTo(): string { return this.metaData.replyTo; }
    public get sagaKey(): string { return this.metaData.sagaKey; }

    /**
     * Allows getting a value in the messages metaData
     *
     * @template T
     * @param {string} key
     * @returns {T}
     *
     * @memberOf MessageHandlerContext
     */
    public getMetaDataValue<T>(key: string): T {
        if (this.metaData.contains(key)) {
            return this.metaData.item(key);
        } else {
            return undefined;
        }
    }

    /**
     * Allows setting a value in the messages metaData
     *
     * @param {string} key
     * @param {*} value
     *
     * @memberOf MessageHandlerContext
     */
    public setMetaDataValue(key: string, value: any) {
        this.metaData.update(key, value);
    }

    /**
     * Publishes a message using the current messages context. This makes the published
     * message a child of the current message.
     *
     * @template T
     * @param {(IMessage<T> | T)} message
     *
     * @memberOf MessageHandlerContext
     */
    public publish<T>(message: IMessage<T> | T): void {
        this.bus.publishInternal(message, new SendOptions(), this);
    }

    /**
     * Sends a message using the current messages context. This makes the sent
     * message a child of the current message. This method also support the
     * reply of a message from the target of the message.
     *
     * @template T, R
     * @param {(T | IMessage<T>)} message
     * @param {R} return message
     * @param {SendOptions} [options]
     * @returns {Promise<any>}
     *
     * @memberOf MessageHandlerContext
     */
    public sendAsync<T, R>(message: T | IMessage<T>, options?: SendOptions): Promise<R> {
        return this.bus.sendInternalAsync(message, options, this, true);
    }

    /**
     * Sends a message using the current messages context. This makes the sent
     * message a child of the current message. This method does not support the
     * target of a message sending a reply.
     *
     * @template T
     * @param {(T | IMessage<T>)} message
     * @param {SendOptions} [options]
     * @returns {Promise<any>}
     *
     * @memberOf MessageHandlerContext
     */
    public send<T>(message: T | IMessage<T>, options?: SendOptions): Promise<any> {
        return this.bus.sendInternalAsync(message, options, this, false);
    }

    /**
     * Sends a reply to the current message back to the originating sender
     *
     * @template T
     * @param {T} reply
     *
     * @memberOf MessageHandlerContext
     */
    public reply<T>(reply: T): void {
        var msg = { type: "reply." + this.messageType, message: reply } as IMessage<any>;
        msg.metaData = new MetaData();
        // Need to add a replyTo so it can be delivered to the correct handler
        msg.metaData.replyTo = this.metaData.messageId;
        // Here a publish is used instead of a send as only a publish supports wild card subscriptions
        // this is needed by the Bus to subscribe to all reply messages ie reply.*
        this.bus.publishInternal(msg, new SendOptions(), this);
    }

    /**
     * Stops the additional processing of this message through the pipeline
     * including sending the message to the handler.
     *
     * @memberOf IMessageHandlerContext
     */
    public DoNotContinueDispatchingCurrentMessageToHandlers() {
        this.metaData.shouldTerminatePipeline = true;
    }
}