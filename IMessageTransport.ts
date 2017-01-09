import TimeSpan from './TimeSpan'
import { IMessage } from './IMessage'


export class QueueEndpoint {
    host: string;
    name: string;

    fullname(): string {
        return `${this.host}.${this.name}`;
    }
}

export interface IMessageTransport {
    /**
     * Publishes an event message to the Endpoint
     * 
     * @param {Message} message
     * 
     * @memberOf IMessageTransport
     */
    publish(message: IMessage<any>): void;

    /**
     * Sends a command message to the Endpoint
     * 
     * @param {Message} message
     * @param {TimeSpan} timeToDelay
     * 
     * @memberOf IMessageTransport
     */
    send(message: IMessage<any>, timeToDelay?: TimeSpan): void;

    /**
     * Create a subsription on the Endpoint
     * 
     * @param {string} name
     * 
     * @memberOf IMessageTransport
     */
    subscribe(name: string, filter: string): void;

    /**
     * Removes a subsription on the Endpoint
     * 
     * @param {string} name
     * 
     * @memberOf IMessageTransport
     */
    unsubscribe(name: string): void;

    /**
     * Notifies subscribers when a message arrives indicating which
     * subscription the message is for via the MetaData property
     * Transport.Subscription
     * 
     * @param {(message: IMessage<any>)} handler
     * 
     * @memberOf IMessageTransport
     */
    onMessage(handler: (message: IMessage<any>) => void);
}