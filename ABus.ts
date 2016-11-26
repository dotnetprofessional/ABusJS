import Hashtable from './hashtable';
import { IMessageTask, MessageExceptionTask } from './MessageTasks'
import TimeSpan from './TimeSpan'
import {Saga} from './Saga'

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

export interface IMessage<T> {
    type: string;
    message: T;
    metaData?: Hashtable<any>;
}

export class Message<T> {
    type: string;
    message: T;
}

export interface IMessageHandler<T> {
    (message: T, context: MessageHandlerContext): void | Promise<void>;
}

// Internal interface to track instances of subscriptions
class SubscriptionInstance {
    subscriptionId: string;
    messageSubscription: IMessageSubscription<any>;
    options: MessageHandlerOptions;
}

export class RegisteredSubscription {
    constructor(public readonly subscriptionId: string, public readonly messageType: string) {

    }
}

export interface IMessageSubscription<T> {
    messageType: string;
    handler: IMessageHandler<T>;
}

export class MessageHandlerOptions {
    threading?: ThreadingOptions = ThreadingOptions.Single;
}

export enum ThreadingOptions {
    Single,
    Pool
}


/**
 * Provides additional information about the current state
 * of the message being processed. The metaData property
 * can be used to pass additional data through the pipeline
 * 
 * @export
 * @interface IMessageHandlerContext
 */
export interface IMessageHandlerContext {
    readonly messageType: string;
    readonly messageId: string;
    readonly conversationId: string;
    readonly correlationId: string
    metaData: Hashtable<string>;
    readonly replyTo: string;
    readonly sagaKey: string;

    bus: Bus

    publish<T>(message: IMessage<T>): void;
    send<T>(message: IMessage<T>, options: SendOptions): void
}

export class SendOptions {
    deliverIn?: TimeSpan;
    // deliverAt?: Date; // Enable when able to persist messages
}

export class MessageHandlerContext implements IMessageHandlerContext {
    constructor(public bus: Bus, public metaData: Hashtable<any> = new Hashtable<string>()) {
    }

    get messageType(): string { return this.metaData.item("messageType"); }
    get messageId(): string { return this.metaData.item("messageId"); }
    get conversationId(): string { return this.metaData.item("conversationId"); }
    get correlationId(): string { return this.metaData.item("correlationId"); }
    get replyTo(): string { return this.metaData.item("replyTo"); }
    get sagaKey(): string { return this.metaData.item("sagaKey"); }
    get shouldTerminatePipeline(): boolean { return !!(this.metaData.item("shouldTerminatePipeline")); }

    set messageType(messageType: string) { this.metaData.update("messageType", messageType); }
    set messageId(messageId: string) { this.metaData.update("messageId", messageId); }
    set conversationId(conversationId: string) { this.metaData.update("conversationId", conversationId); }
    set correlationId(correlationId: string) { this.metaData.update("correlationId", correlationId); }
    set replyTo(replyTo: string) { this.metaData.update("replyTo", replyTo); }
    set sagaKey(sagaKey: string) { this.metaData.update("sagaKey", sagaKey); }
    set shouldTerminatePipeline(shouldTerminatePipeline: boolean) { this.metaData.update("shouldTerminatePipeline", shouldTerminatePipeline.toString()); }

    getMetaDataValue<T>(key: string): T {
        if (this.metaData.contains(key)) {
            return this.metaData.item(key);
        } else {
            return undefined;
        }
    }

    setMetaDataValue(key: string, value: any) {
        this.metaData.update(key, value);
    }

    publish<T>(message: IMessage<T>): void {
        this.bus.publishInternal(message, new MessageHandlerContext(this.bus, this.metaData));
    }

    send<T>(message: IMessage<T>, options?: SendOptions): void {
        this.bus.sendInternal(message, options, new MessageHandlerContext(this.bus, this.metaData));
    }

    reply<T>(reply: T): void {
        var msg = { type: this.messageType + ".reply", message: reply };
        this.bus.publishInternal(msg, new MessageHandlerContext(this.bus, this.metaData));
    }
}

export class Guid {
    private static sUniqueIdCount = 0;
    static newGuid(): string {
        Guid.sUniqueIdCount++;
        return Guid.sUniqueIdCount.toString();
    }
}


export class Bus {
    private _messageTypes = new Hashtable<Array<SubscriptionInstance>>();
    private _messageTasks = new MessageTasks([]);
    private _replyToMessages = new Hashtable<ReplyHandler>();

    private _config = {
        tracking: false,
        useConventions: true,

    };

    constructor() {
        this.messageTasks.add(new MessageExceptionTask());
        this.addSystemSubscriptions();
    }

    private get messageTypes() {
        return this._messageTypes;
    }
    get config() {
        return this._config;
    }

    get messageTasks() {
        return this._messageTasks;
    }

    getSubscribers(messageType: string): SubscriptionInstance[] {
        return this.messageTypes.item(messageType);
    }

    subscribe<T>(subscription: IMessageSubscription<T>, options: MessageHandlerOptions = new MessageHandlerOptions()): RegisteredSubscription {

        let userOptions = Utils.assign(new MessageHandlerOptions(), options);

        if (!subscription) {
            throw new TypeError("Invalid subscription.");
        }

        if (!subscription.messageType) {
            throw new TypeError("Invalid messageType " + subscription.messageType);
        }
        if (typeof subscription.handler !== 'function') {
            throw new TypeError('messageHandler must be a function');
        }

        let messageType = subscription.messageType;
        if (!this.messageTypes.contains(messageType)) {
            // Add entry for message type
            this.messageTypes.add(messageType, []);
        }

        // Register function/subsciption with messageType
        var list = this.messageTypes.item(messageType);

        // create a subscription instances
        let subscriptionInstance = new SubscriptionInstance();
        subscriptionInstance.subscriptionId = Guid.newGuid();
        subscriptionInstance.messageSubscription = subscription;
        subscriptionInstance.options = options;

        list.push(subscriptionInstance);
        return new RegisteredSubscription(subscriptionInstance.subscriptionId, messageType);
    }

    unsubscribe(subscription: RegisteredSubscription) {
        // Locate all subscriptions for this message type
        var subscribers = this.messageTypes.item(subscription.messageType);
        if (subscribers) {
            for (let i = 0; i < subscribers.length; i++) {
                let sub = subscribers[i];
                if (sub.subscriptionId === subscription.subscriptionId) {
                    // remove from array
                    subscribers.splice(i, 1);
                }
            }
        }
    }

    subscriberCount(messageType: string): number {
        var subscribers = this.messageTypes.item(messageType);
        if (!subscribers) {
            return undefined;
        } else {
            return subscribers.length;
        }
    }
    send<T>(message: IMessage<T>, options?: SendOptions): Promise<any> {
        let context = new MessageHandlerContext(this);
        return this.sendInternal(message, options, context);
    }

    sendInternal<T>(message: IMessage<T>, options: SendOptions, context: IMessageHandlerContext): Promise<any> {
        // Find any subscribers for this message
        var subscribers = this.messageTypes.item(message.type) || [];

        if (subscribers.length > 1) {
            throw new TypeError("Commands must have only one subscriber.")
        } else if (subscribers.length === 0) {
            throw new TypeError("No subscriber defined for this command.");
        }

        if (!message.metaData) {
            message.metaData = new Hashtable<any>();
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

        // Delivery the message to be sent to the command subscriber
        this.dispatchMessageToSubscribers(message, context, subscribers);

        return replyHandlerPromise;
    }

    publish<T>(message: IMessage<T>): void {
        let context = new MessageHandlerContext(this);
        this.publishInternal(message, context);
    }

    // Typescript doesn't support internal methods yet
    publishInternal<T>(message: IMessage<T>, context: IMessageHandlerContext) {
        // Find any subscribers for this message
        var subscribers = this.messageTypes.item(message.type) || [];

        //TODO: [GM] Optimize this so that its only called if at least one subtype was subscribed 
        // There may also be subscribers that subscribed to a subtype
        subscribers = subscribers.concat(this.getStartsWithSubscribers(message.type) || []);
        subscribers = subscribers.concat(this.getEndsWithSubscribers(message.type) || []);

        if (subscribers.length !== 0) {
            this.dispatchMessageToSubscribers(message, context, subscribers);
        }
    }

    private getStartsWithSubscribers(messageType: string): SubscriptionInstance[] {
        var subTypes = messageType.split('.');
        var subscribers = [] as SubscriptionInstance[];
        var searchType = '';
        for (let i = 0; i < subTypes.length - 1; i++) {
            searchType += subTypes[i] + '.';
            subscribers = subscribers.concat(this.messageTypes.item(searchType + '*') || []);
        }

        return subscribers;
    }

    private getEndsWithSubscribers(messageType: string): SubscriptionInstance[] {
        var subTypes = messageType.split('.');
        var subscribers = [] as SubscriptionInstance[];
        var searchType = '';
        for (let i = subTypes.length - 1; i >= 0; i--) {
            searchType += '.' + subTypes[i];
            subscribers = subscribers.concat(this.messageTypes.item("*" + searchType) || []);
        }

        return subscribers;
    }

    public dispatchMessageToSubscribers(message: IMessage<any>, context: IMessageHandlerContext, subscribers: SubscriptionInstance[]) {
        let newContext = new MessageHandlerContext(this, message.metaData || new Hashtable<string>());
        // Add context data to message
        if (!context.conversationId) {
            newContext.conversationId = Guid.newGuid();
        } else {
            newContext.conversationId = context.conversationId;
        }

        if (context.replyTo) {
            newContext.replyTo = context.replyTo;
        }

        if (context.sagaKey) {
            newContext.sagaKey = context.sagaKey;
        }
        // CorrelationId becomes the current messa
        newContext.correlationId = context.messageId;
        newContext.messageId = Guid.newGuid();
        newContext.messageType = message.type;

        for (let subscription of subscribers) {
            this.ExecuteMessageTasksAsync(message, newContext, this.messageTasks.localInstance, subscription);
        }

    }

    async ExecuteMessageTasksAsync(message: IMessage<any>, context: MessageHandlerContext, tasks: MessageTasks, subscription: SubscriptionInstance) {
        let task = tasks.next;

        // determine if the task is using a promise and if so wait for it to complete
        await task.invoke(message, context, async () => {
            if (tasks.next != null && !context.shouldTerminatePipeline) {
                await this.ExecuteMessageTasksAsync(message, context, tasks, subscription);
            }
            else {
                let handler = subscription.messageSubscription.handler;
                await handler(message, context);
            }
        });
    }

    unregisterAll(): void {
        this.messageTypes.clear();
        this.addSystemSubscriptions();
    }

    private addSystemSubscriptions() {
        // Subscribe for all .reply messages so they can be returned to their callers        
        this.subscribe({
            messageType: "*.reply", handler: (message: IMessage<any>, context: MessageHandlerContext) => {
                var replyToHandler = this._replyToMessages.item(context.replyTo);
                if (replyToHandler) {
                    replyToHandler.resolve(message.message);

                    // Remove the handler
                    this._replyToMessages.remove(context.replyTo);
                }
            }
        });
    }

    public registerSaga<T>(saga: Saga<T>) {
        saga.bus = this;
    }
}

export class ReplyHandler {
    constructor() {

    }
    resolve: any;
    reject: any;
    replyTo: string;
}

export class Utils {
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    static assign<T, U>(target: T, source: U): T {
        for (let attr in source) {
            target[attr] = source[attr];
        }

        return target;
    }
}

