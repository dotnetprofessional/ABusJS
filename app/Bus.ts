import Hashtable from './Hashtable';
import { IMessageTask } from './Tasks/IMessageTask'
import { MessageExceptionTask } from './Tasks/MessageExceptionTask'
//import { Saga } from './Saga'
import { LocalTransport } from './LocalTransport'
import { SubscriptionInstance } from './SubscriptionInstance'
import { ReplyHandler } from './ReplyHandler'
import { IMessageSubscription } from './IMessageSubscription'
import { MessageHandlerOptions } from './MessageHandlerOptions'
import { IMessage } from './IMessage'
import { Guid } from './Guid'
import { SendOptions } from './SendOptions'
import { IMessageHandlerContext } from './IMessageHandlerContext'
import { MessageHandlerContext } from './MessageHandlerContext'
import { MetaData, Intents } from './MetaData'
import { AddStandardMetaDataTask } from './Tasks/AddStandardMetaDataTask'
import { IMessageTransport } from './IMessageTransport'

// Class to manage the message task handlers executed for each message
export class MessageTasks {
    private _tasks: IMessageTask[];
    private _iterationCount = 0;

    constructor(tasks: IMessageTask[]) {
        this._tasks = tasks;
    }

    // This method is used to get an instance that can be iterated by multiple 'threads'
    get localInstance(): MessageTasks {
        return new MessageTasks(this._tasks);
    }
    add(task: IMessageTask) {
        this._tasks.push(task);
    }

    clear() {
        this._tasks = [];
    }

    get first(): IMessageTask {
        this._iterationCount = 0;
        return this.next;
    }

    get next(): IMessageTask {
        if (this._iterationCount >= this._tasks.length) {
            return null;
        }
        else {
            let task = this._tasks[this._iterationCount];
            this._iterationCount++;
            return task;
        };
    }
}

export class Bus {
    private _messageHandlers = new Hashtable<SubscriptionInstance>();
    private _outBoundMessageTasks = new MessageTasks([]);
    private _inBoundMessageTasks = new MessageTasks([]);
    private _replyToMessages = new Hashtable<ReplyHandler>();
    private _messageTransport = new LocalTransport();
    private _baseOptions = new SendOptions();

    public static instance: Bus = new Bus();

    /**
     * Makes this Bus instance globally reachable through Bus.instance.
     *
     * @memberOf Bus
     */
    public makeGlobal(): Bus {
        Bus.instance = this;
        return this;
    }

    private _config = {
        tracking: false,
        useConventions: true,
    };

    constructor() {
        this.outBoundMessageTasks.add(new MessageExceptionTask());
        this.outBoundMessageTasks.add(new AddStandardMetaDataTask());
        this.inBoundMessageTasks.add(new MessageExceptionTask());
        this.addSystemSubscriptions();
        this.registerForTransportEvents();
    }

    private get messageHandlers() {
        return this._messageHandlers;
    }

    private getTransport(messageFilter: string) {
        // Update with logic to pick the correct transport based on message type.
        messageFilter = ""; // Only to suppress compile errors until this parameter is used.
        return this._messageTransport;
    }

    private unregisterAllTransports() {
        this._messageTransport.unsubscribeAll();
    }

    get config() {
        return this._config;
    }

    get inBoundMessageTasks() {
        return this._inBoundMessageTasks;
    }

    get outBoundMessageTasks() {
        return this._outBoundMessageTasks;
    }

    //getSubscribers(messageType: string): SubscriptionInstance[] {
    //    return this.messageHandlers.item(messageType);
    //}

    subscribe<T>(subscription: IMessageSubscription<T>, options: MessageHandlerOptions = new MessageHandlerOptions()): string {
        if (!subscription) {
            throw new TypeError("Invalid subscription.");
        }

        if (!subscription.messageFilter) {
            throw new TypeError("Invalid messageType " + subscription.messageFilter);
        }
        if (typeof subscription.handler !== 'function') {
            throw new TypeError('messageHandler must be a function');
        }

        // A name should be specified if the handler deals with persistent messages,
        // however it is optional otherwise so if none is specified a unique one will be generated.
        if (!subscription.name) {
            subscription.name = Guid.newGuid();
        }

        if (this.messageHandlers.contains(subscription.name)) {
            throw TypeError(`A subscription with the name ${subscription.name} already exists.`);
        }

        // create a subscription instances
        let subscriptionInstance = new SubscriptionInstance();
        subscriptionInstance.name = subscription.name;
        subscriptionInstance.messageSubscription = subscription;
        subscriptionInstance.options = options;

        this.messageHandlers.add(subscription.name, subscriptionInstance);

        // Register the subscription with the applicable transport
        var transport = this.getTransport(subscription.messageFilter);
        transport.subscribe(subscription.name, subscription.messageFilter);
        return subscriptionInstance.name;
    }

    unsubscribe(subscriptionName: string) {
        // Locate all subscriptions for this message type
        var subscription = this.messageHandlers.item(subscriptionName);
        if (subscription) {
            this.messageHandlers.remove(subscriptionName);

            // Also remove the message from the transport
            var transport = this.getTransport(""); // [GM]: May need to record the transport used for subscription
            transport.unsubscribe(subscriptionName);

        }
    }

    subscriberCount<T>(messageFilter: string | T): number {
        let filter = "";
        if (typeof (messageFilter) === "string") {
            filter = messageFilter;
        } else {
            filter = this.getTypeNamespace(messageFilter);
        }

        var transport = this.getTransport(filter);
        return transport.subscriberCount(filter);
    }

    sendAsync<T, R>(message: IMessage<T> | T, options?: SendOptions): Promise<R> {
        let context = new MessageHandlerContext(this);
        return this.sendInternalAsync(message as IMessage<T>, options, context);
    }

    /**
     * Returns the passed in message if already of type IMessage<T> otherwise
     * returns a derived IMessage<T> from the message.
     *
     * @private
     * @param {(IMessage<T>|T)} message
     * @returns {IMessage<T>}
     *
     * @memberOf Bus
     */
    private getIMessage<T>(message: IMessage<T> | T): IMessage<T> {
        // Determine if the message passed is of IMessage
        let messageCheck = message as IMessage<T>;
        if (!messageCheck.type && !messageCheck.message) {
            // This appears to be an object that is not of type IMessage
            // Synthesize an IMessage from what we know.
            let name = this.getTypeNamespace(message);
            //var name = (message.constructor as any).name;
            if (!name) {
                throw TypeError("You must pass either an instance of IMessage<T> or a class. You cannot pass an object literal.");
            }
            // Redefine the parameter as an IMessage
            message = { type: name, message: message, metaData: new MetaData() } as IMessage<T>;
        }

        return message as IMessage<T>;
    }

    /** @internal */
    public getTypeNamespace(typeOrInstance: any) {
        var proto = typeOrInstance.prototype || Object.getPrototypeOf(typeOrInstance);

        if (proto.__namespace !== undefined && proto.hasOwnProperty("__namespace")) {
            return proto.__namespace;
        }

        var superNamespace = Object.getPrototypeOf(proto).__namespace;
        if (superNamespace !== undefined) {
            return proto.__namespace = superNamespace + "." + proto.constructor.name;
        }

        var nameChain = this.getTypeNamespaceChain(proto, null);
        nameChain.shift();
        return proto.__namespace = nameChain.join(".");
    }

    getTypeNamespaceChain(proto: any, stack: any) {
        stack = stack || [];
        stack.unshift(proto.constructor.name);
        var next = Object.getPrototypeOf(proto);
        return next && this.getTypeNamespaceChain(next, stack) || stack;
    }

    /** @internal */
    sendInternalAsync<T>(message: IMessage<T> | T, options: SendOptions, context: IMessageHandlerContext): Promise<any> {
        // Ensure we have an IMessage<T>
        let messageToSend = this.getIMessage(message)

        // Get the transport for this message type
        var transport = this.getTransport(messageToSend.type);

        // Initialize the metaData for the message
        messageToSend.metaData = new MetaData();
        messageToSend.metaData.messageId = Guid.newGuid();
        messageToSend.metaData.intent = Intents.send;

        options = { ...this._baseOptions, ...options };

        var subscribers = transport.subscriberCount(messageToSend.type);
        if (subscribers > 1) {
            throw new TypeError(`The command ${messageToSend.type} must have only one subscriber.`);
        } else if (subscribers === 0) {
            throw new TypeError(`No subscriber defined for the command ${messageToSend.type}`);
        }

        let replyHandler = new ReplyHandler();
        let replyHandlerPromise = new Promise((resolve, reject) => {
            replyHandler.resolve = resolve;
            replyHandler.reject = reject;
            replyHandler.replyTo = messageToSend.metaData.messageId;
            this._replyToMessages.add(replyHandler.replyTo, replyHandler);
            // Add a timeout here too. This can be a default but also supplied as part of the sendOptions
        });

        // Delivery the message to be sent to the transport
        this.dispatchOutboundMessageAsync(messageToSend, options, context, this.outBoundMessageTasks.localInstance);
        return replyHandlerPromise;
    }

    publish<T>(message: IMessage<T> | T): void {
        let context = new MessageHandlerContext(this);
        this.publishInternal(message, new SendOptions(), context);
    }

    // Typescript doesn't support internal methods yet
    /** @internal */
    publishInternal<T>(message: IMessage<T> | T, options: SendOptions, context: IMessageHandlerContext) {
        // Ensure we have an IMessage<T>
        message = this.getIMessage(message);

        // Initialize the metaData for the message
        if (!message.metaData) {
            message.metaData = new MetaData();
        }
        message.metaData.messageId = Guid.newGuid();
        message.metaData.intent = Intents.publish;

        this.dispatchOutboundMessageAsync(message, options, context, this.outBoundMessageTasks.localInstance);
    }


    unregisterAll(): void {
        this.messageHandlers.clear();
        this.unregisterAllTransports();
        this.addSystemSubscriptions();
    }

    private addSystemSubscriptions() {
        // Subscribe for all .reply messages so they can be returned to their callers
        let transport = this.getTransport("*");

        transport.subscribe("replyToHandlerXXX", "*.reply");
    }

    /*
        public registerSaga<T>(saga: Saga<T>) {
            saga.bus = this;
        }
    */

    private registerForTransportEvents(): void {
        let transport = this.getTransport("*");

        transport.onMessage(async (message: IMessage<any>) => {
            var replyToHandler = this._replyToMessages.item(message.metaData.replyTo);
            if (replyToHandler) {
                replyToHandler.resolve(message.message);

                // Remove the handler
                this._replyToMessages.remove(message.metaData.replyTo);
            } else {
                // A non-reply message
                // Find the handler that subscribed to this message
                let subscription = this.messageHandlers.item(message.metaData.item('subscription'));
                // Ensure the subscription is still registered before attempting to dispatch it.
                if (subscription) {
                    await this.dispatchInboundMessageAsync(message, new MessageHandlerContext(this, message.metaData), this.inBoundMessageTasks.localInstance, subscription, transport);
                } else {
                    // Mark the message as complete as there are no subscribers for this message
                    transport.completeMessageAsync(message.metaData.messageId);
                }
            }
        });

    }

    async dispatchOutboundMessageAsync(message: IMessage<any>, options: SendOptions, context: IMessageHandlerContext, tasks: MessageTasks) {
        let task = tasks.next;

        if (task != null) {
            // determine if the task is using a promise and if so wait for it to complete
            await task.invokeAsync(message, context, async () => {
                if (context.shouldTerminatePipeline) {
                    // Stop the processing of the pipeline immediately.
                    return;
                }

                await this.dispatchOutboundMessageAsync(message, options, context, tasks);
            });
        }
        else {
            // Final step send message to the transport
            let transport = this.getTransport(message.type);
            if (message.metaData.intent === Intents.publish) {
                transport.publish(message);
            } else {
                transport.send(message, options.deliverIn);
            }
        }
    }

    async dispatchInboundMessageAsync(message: IMessage<any>, context: MessageHandlerContext, tasks: MessageTasks, subscription: SubscriptionInstance, transport: IMessageTransport) {
        let task = tasks.next;

        // determine if the task is using a promise and if so wait for it to complete
        if (task != null) {
            await task.invokeAsync(message, context, async () => {
                if (context.shouldTerminatePipeline) {
                    // Stop the processing of the pipeline immediately.
                    return;
                }

                await this.dispatchInboundMessageAsync(message, context, tasks, subscription, transport);
            });
        } else {
            var replyToHandler = this._replyToMessages.item(message.metaData.replyTo);
            if (replyToHandler) {
                await replyToHandler.resolve(message.message);

                // Remove the handler
                this._replyToMessages.remove(message.metaData.replyTo);
            } else {
                let handler = subscription.messageSubscription.handler
                let handlerResult = handler(message.message, context);
                if (handlerResult && handlerResult["then"]) {
                    (handlerResult as Promise<void>).then(() => {
                        // If reached this far the handler processed the message and so the message can be removed from the queue
                        transport.completeMessageAsync(message.metaData.messageId);
                    });
                } else {
                    // If reached this far the handler processed the message and so the message can be removed from the queue
                    transport.completeMessageAsync(message.metaData.messageId);
                }
            }
        }
    }
}

