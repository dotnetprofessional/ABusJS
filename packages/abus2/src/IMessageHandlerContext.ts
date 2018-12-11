import { ISendMessages } from "./ISendMessages";
import { IMessage } from "./IMessage";

/**
 * Provides additional data about the current message, it also supports
 * the ability to link incoming messages with outgoing messages when
 * using the context methods for sending an publishing.
 *
 * @export
 * @class MessageHandlerContext
 * @implements {IMessageHandlerContext}
 */
export interface IMessageHandlerContext extends ISendMessages {

    /**
     * Sends a reply to the current message back to the originating sender
     *
     * @template T
     * @param {T} reply
     *
     * @memberOf MessageHandlerContext
     */
    replyAsync<T>(reply: T): Promise<void>;

    /**
     * Stops the additional processing of this message through the pipeline
     * including sending the message to the handler.
     *
     * @memberOf IMessageHandlerContext
     */
    DoNotContinueDispatchingCurrentMessageToHandlers();

    /**
     * The currently active message, this is the same message returned as the first
     * parameter of the handler, except its the full structure not just the payload.
     *
     * @type {IMessage<any>}
     * @memberof IMessageHandlerContext
     */
    activeMessage: IMessage<any>;
}