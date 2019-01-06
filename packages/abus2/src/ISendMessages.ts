import { IMessage } from "./IMessage";
import { SendOptions } from "./SendOptions";
import { ReplyRequest } from "./ReplyRequest";

export interface ISendMessages {
    /**
 * Publishes a message using the current messages context. This makes the published
 * message a child of the current message. The method returns immediately after validating
 * without waiting for the message to be delivered.
 *
 * @template T
 * @param {(IMessage<T> | T)} message
 * @param {SendOptions} [options]
 *
 * @memberOf MessageHandlerContext
 */
    publishAsync<T>(message: IMessage<T> | T, options?: SendOptions): Promise<void>;

    /**
     * Sends a message using the current messages context. This makes the sent
     * message a child of the current message. This method also supports the
     * reply of a message from the target of the message.
     *
     * @template T, R
     * @param {(T | IMessage<T>)} message
     * @param {R} return message
     * @param {SendOptions} [options]
     * @returns {Promise<ReplyRequest>}
     *
     * @memberOf MessageHandlerContext
     */
    sendWithReply<T, R>(message: T | IMessage<T>, options?: SendOptions): ReplyRequest;

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
    sendAsync<T>(message: T | IMessage<T>, options?: SendOptions): Promise<void>;
}