import TimeSpan from '../Timespan'
import { IMessage } from '../IMessage'

/**
 *
 *
 * @export
 * @interface IMessageTransport
 */
export interface IMessageTransport {

    /**
     * The name of the transport
     *
     * @type {string}
     * @memberof IMessageTransport
     */
    name: string;

    /**
     * Publishes an event message to the Endpoint
     *
     * @param {Message} message
     *
     * @memberOf IMessageTransport
     */
    publishAsync(message: IMessage<any>): Promise<void>;

    /**
     * Sends a command message to the Endpoint
     *
     * @param {Message} message
     * @param {TimeSpan} timeToDelay
     *
     * @memberOf IMessageTransport
     */
    sendAsync(message: IMessage<any>, timeToDelay?: TimeSpan): Promise<void>;

    /**
     * Notifies subscribers when a message arrives indicating which
     * subscription the message is for via the MetaData property
     * Transport.Subscription
     *
     * @param {(message: IMessage<any>)} handler
     *
     * @memberOf IMessageTransport
     */
    onMessage(handler: (message: IMessage<any>) => void): void;

    /**
     * Marks the message as processed and prevents it from being sent again.
     *
     * @param {string} messageId
     *
     * @memberOf IMessageTransport
     */
    completeMessageAsync(messageId: string): Promise<void>;

    /**
     * Start listening for incoming messages
     *
     * @memberof IMessageTransport
     */
    startAsync(): Promise<void>;
}