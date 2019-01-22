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
    DoNotContinueDispatchingCurrentMessageToHandlers(): void;

    /**
     * The currently active message, this is the same message returned as the first
     * parameter of the handler, except its the full structure not just the payload.
     *
     * @type {IMessage<any>}
     * @memberof IMessageHandlerContext
     */
    activeMessage: IMessage<any>;

    /**
     * The message from the handler that send the active message
     *
     * @type {IMessage<any>}
     * @memberof IMessageHandlerContext
     */
    parentMessage: IMessage<any>;

    /**
     * Terminates the processing of the pipeline
     *
     * @type {boolean}
     * @memberof IMessageHandlerContext
     */
    shouldTerminatePipeline: boolean;

    /**
     * Indicates if this context has been cancelled. When cancelled
     * receiving and sending of messages will be ignored.
     *
     * @type {boolean}
     * @memberof IMessageHandlerContext
     */
    isCancelled: boolean;
}