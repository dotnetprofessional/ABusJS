import { ISendMessages } from "./ISendMessages";
import { IMessageHandler } from "./IMessageHandler";
import { TransportGrammar } from "./fluent/transportGrammar";

export interface IBus extends ISendMessages {
    /**
     * Starts the transport listeners
     *
     * @memberof IBus
     */
    start();

    /**
     * Returns the registered transport for the supplied message type
     * this method is useful when wanting to extend the transports pipeline
     *
     * @param {string} type
     * @returns {IRegisteredTransport}
     * @memberof IBus
     */
    usingRegisteredTransportToMessageType(type: string): TransportGrammar;

    /**
     * registers the message type with a previously registered transport
     * all message of the type will be forwarded to this transport.
     *
     * @param {string} transportId
     * @param {string} messageType
     * @memberof IBus
     */
    routeToTransport(transportId: string, messageType: string);

    /**
     * registers the message types within the namespace/object with a previously
     * registered transport all message of the type will be forwarded to this transport.
     *
     * @param {string} transportId
     * @param {Function} namespace
     * @memberof IBus
     */
    routeToTransport(transportId: string, namespace: Function);

    /**
     * Registers a handler to receive messages matching the type of the filter.
     * This can be a specific type or one of two wildcards
     * string* : matches any type that starts with the string
     * *string : mathes any type that ends with the string 
     *
     * @param {string} filter
     * @param {IMessageHandler<any>} handler
     * @returns {string} the subscriptionId, needed to unsubscribe
     * @memberof IBus
     */
    subscribe(filter: string, handler: IMessageHandler<any>): string;

    /**
     * Unsubscribes handler for messages. Requires subscriptionId returned
     * when subscribing the handler.
     *
     * @param {string} subscriptionId
     * @memberof IBus
     */
    unsubscribe(subscriptionId: string);
}