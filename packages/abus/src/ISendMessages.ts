import { IMessage } from "./IMessage";
import { ISendOptions } from "./ISendOptions";
import { ISubscriptionOptions } from './ISubscriptionOptions';
import { TimeSpan } from './Timespan';

export interface ISendMessages {
    /**
     * Publishes a message using the current messages context. This makes the published
     * message a child of the current message. The method returns immediately after validating
     * without waiting for the message to be delivered.
     *
     * @template T
     * @param {(IMessage<T> | T)} message
     * @param {ISendOptions} [options]
     *
     * @memberOf MessageHandlerContext
     */
    publishAsync<T>(message: IMessage<T> | T, options?: ISendOptions): Promise<void>;

    /**
     * Sends a message using the current messages context. This makes the sent
     * message a child of the current message. This method also supports the
     * reply of a message from the target of the message.
     *
     * @template T, R
     * @param {(T | IMessage<T>)} message
     * @param {R} return message
     * @param {ISendOptions} [options]
     * @returns {Promise<ReplyRequest>}
     *
     * @memberOf MessageHandlerContext
     */
    sendWithReplyAsync<R>(message: object | IMessage<any>, options?: ISendOptions): Promise<R>;

    /**
     * Sends a message using the current messages context. This makes the sent
     * message a child of the current message. This method does not support the
     * target of a message sending a reply.
     *
     * @template T
     * @param {(T | IMessage<T>)} message
     * @param {ISendOptions} [options]
     * @returns {Promise<any>}
     *
     * @memberOf MessageHandlerContext
     */
    sendAsync<T>(message: T | IMessage<T>, options?: ISendOptions): Promise<void>;

    /**
     * Listen for an event without creating an explicit handler.
     * 
     * This method can be useful when executing a command and need to respond to an event published by the
     * handler of the command and retain the existing code flow. This method only works with events not commands.
     *
     * @template T
     * @param {string} filter
     * @param {ISubscriptionOptions} options
     * @returns {Promise<T>}
     * @memberof IMessageHandlerContext
     */
    waitForEventAsync<T>(filter: string, options?: ISubscriptionOptions & { timeout?: TimeSpan }): Promise<T>;
}