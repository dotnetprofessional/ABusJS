import Hashtable from './hashtable';
import { IMessageTask, MessageExceptionTask } from './Tasks/MessageTasks'
import TimeSpan from './TimeSpan'
//import { Saga } from './Saga'
import { TimeoutManager } from './TimeoutManager'
import { LocalTransport } from './LocalTransport'
import { SubscriptionInstance } from './SubscriptionInstance'
import { ReplyHandler } from './ReplyHandler'
import { IMessageSubscription } from './IMessageSubscription'
import { MessageHandlerOptions } from './MessageHandlerOptions'
import { Utils } from './Utils'
import { IMessage } from './IMessage'
import { Guid } from './Guid'
import { SendOptions } from './SendOptions'
import { IMessageHandlerContext } from './IMessageHandlerContext'
import { MessageHandlerContext } from './MessageHandlerContext'
import { MetaData, Intents } from './MetaData'
import { AddStandardMetaDataTask } from './Tasks/AddStandardMetaDataTask'

// Class to manage the message task handlers executed for each message
class MessageTasks {
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
    private _timeoutManager = new TimeoutManager(this);
    private _messageTransport = new LocalTransport();

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

        let userOptions = Utils.assign(new MessageHandlerOptions(), options);

        if (!subscription) {
            throw new TypeError("Invalid subscription.");
        }

        if (!subscription.messageFilter) {
            throw new TypeError("Invalid messageType " + subscription.messageFilter);
        }
        if (typeof subscription.handler !== 'function') {
            throw new TypeError('messageHandler must be a function');
        }

        // A name should be specified if the handler deals with persistant messages,
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

    subscriberCount(messageFilter: string): number {
        var transport = this.getTransport(messageFilter);
        return transport.subscriberCount(messageFilter);
    }

    send<T>(message: IMessage<T>, options?: SendOptions): Promise<any> {
        let context = new MessageHandlerContext(this);
        message.metaData = context.metaData;
        return this.sendInternal(message, options, context);
    }

    sendInternal<T>(message: IMessage<T>, options: SendOptions, context: IMessageHandlerContext): Promise<any> {
        // Get the transport for this message type
        var transport = this.getTransport(message.type);

        options = Utils.assign(new SendOptions(), options);

        var subscribers = transport.subscriberCount(message.type);
        if (subscribers > 1) {
            throw new TypeError(`The command ${message.type} must have only one subscriber.`);
        } else if (subscribers === 0) {
            throw new TypeError(`No subscriber defined for the command ${message.type}`);
        }

        if (!message.metaData) {
            message.metaData = new MetaData();
        }
        let replyTo = Guid.newGuid();

        message.metaData.update("replyTo", replyTo);

        let replyHandler = new ReplyHandler();
        let replyHandlerPromise = new Promise((resolve, reject) => {
            replyHandler.resolve = resolve;
            replyHandler.reject = reject;
            replyHandler.replyTo = replyTo;
            this._replyToMessages.add(replyTo, replyHandler);
            // Add a timeout here too. This can be a default but also supplied as part of the sendOptions
        });
        context.metaData.intent = Intents.send;

        // Delivery the message to be sent to the transport
        this.dispatchOutboundMessageAsync(message, options, context, this.inBoundMessageTasks.localInstance);
        return replyHandlerPromise;
    }

    publish<T>(message: IMessage<T>): void {
        let context = new MessageHandlerContext(this);
        message.metaData = context.metaData;
        this.publishInternal(message, new SendOptions(), context);
    }

    // Typescript doesn't support internal methods yet
    publishInternal<T>(message: IMessage<T>, options: SendOptions, context: IMessageHandlerContext) {
        // Push the message onto the correct transport
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

        transport.subscribe("replyToHandler", "*.reply");
    }

    /*
        public registerSaga<T>(saga: Saga<T>) {
            saga.bus = this;
        }
    */

    private registerForTransportEvents(): void {
        let transport = this.getTransport("*");

        transport.onMessage((message: IMessage<any>) => {
            var replyToHandler = this._replyToMessages.item(message.metaData.replyTo);
            if (replyToHandler) {
                replyToHandler.resolve(message.message);

                // Remove the handler
                this._replyToMessages.remove(message.metaData.replyTo);
            } else {
                // A non-reply message
                // Find the handler that subscribed to this message
                debugger;
                let subscription = this.messageHandlers.item(message.metaData.item('subscription'));
                // Ensure the subscription is still registered before attempting to dispatch it.
                if (subscription) {
                    this.dispatchInboundMessageAsync(message, new MessageHandlerContext(this, message.metaData), this.inBoundMessageTasks.localInstance, subscription);
                }
            }
        });

    }

    // private dispatchMessage(message: IMessage<any>, subscription: SubscriptionInstance, context: MessageHandlerContext) {
    //     let newContext = new MessageHandlerContext(this, message.metaData || new MetaData());
    //     // Add context data to message
    //     /*
    //     if (!context.metaData.conversationId) {
    //         newContext.metaData.conversationId = Guid.newGuid();
    //     } else {
    //         newContext.metaData.conversationId = context.metaData.conversationId;
    //     }

    //     if (context.replyTo) {
    //         newContext.metaData.replyTo = context.replyTo;
    //     }

    //     if (context.sagaKey) {
    //         newContext.metaData.sagaKey = context.sagaKey;
    //     }
    //     // CorrelationId becomes the current messa
    //     newContext.metaData.correlationId = context.messageId;
    //     newContext.metaData.messageId = Guid.newGuid();
    //     newContext.metaData.messageType = message.type;
    //     this.dispatchOutboundMessageAsync(message, newContext, this.messageTasks.localInstance);
    // }

    async dispatchOutboundMessageAsync(message: IMessage<any>, options: SendOptions, context: IMessageHandlerContext, tasks: MessageTasks) {
        let task = tasks.next;

        if (task != null) {
            // determine if the task is using a promise and if so wait for it to complete
            await task.invoke(message, context, async () => {
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

    async dispatchInboundMessageAsync(message: IMessage<any>, context: MessageHandlerContext, tasks: MessageTasks, subscription: SubscriptionInstance) {
        let task = tasks.next;

        // determine if the task is using a promise and if so wait for it to complete
        if (task != null) {
            await task.invoke(message, context, async () => {
                if (context.shouldTerminatePipeline) {
                    // Stop the processing of the pipeline immediately.
                    return;
                }

                await this.dispatchInboundMessageAsync(message, context, tasks, subscription);
            });
        } else {
            var replyToHandler = this._replyToMessages.item(message.metaData.replyTo);
            if (replyToHandler) {
                await replyToHandler.resolve(message.message);

                // Remove the handler
                this._replyToMessages.remove(message.metaData.replyTo);
            } else {
                let handler = subscription.messageSubscription.handler;
                await handler(message, context);
            }
        }
    }
}
