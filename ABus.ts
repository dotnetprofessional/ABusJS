import Hashtable from './hashtable';

export class MessageException<T> {
    readonly errorKey = "ABus.Error";
    readonly errorCount = "ABus.Error.Count";

    constructor(public error: string, public message: IMessage<T>) {
        // Add the error to the message and update the error count
        message.metaData.update(this.errorKey, error);
        var count = message.metaData.item(this.errorCount);
        message.metaData.update(this.errorCount, count ? (count + 1).toString() : "1");
    }

    name: string = MessageException.typeName;

    public static typeName = "ABus.MessageException";
}

export class UnhandledMessageException<T> extends MessageException<T> {
    constructor(public error: string, public message: IMessage<T>) {
        super(error, message);
    }

    public description: string = "Unhandled exception";
}

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

export interface IMessageHandler<T> {
    (message: T, bus: MessageHandlerContext): any
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
export interface IMessageContext {
    id: string;
}

export class MessageHandlerOptions {
    threading: ThreadingOptions = ThreadingOptions.Async;

    static Synchronous(): MessageHandlerOptions {
        var syncHandlerOptions = new MessageHandlerOptions();
        syncHandlerOptions.threading = ThreadingOptions.Sync;
        return syncHandlerOptions;
    }
}

export enum ThreadingOptions {
    Async,
    Sync,
    Pool
}


export interface IMessageHandlerContext {
    messageType: string;
    messageId: string;
    conversationId: string;
    correlationId: string
    metaData: Hashtable<string>;
    replyTo: string;

    pipeline: MessagePipeline

    publish<T>(message: IMessage<T>): void;
    send<T>(message: IMessage<T>): void
}

export class MessageHandlerContext implements IMessageHandlerContext {
    constructor(public pipeline: MessagePipeline, public metaData: Hashtable<any> = new Hashtable<string>()) {
    }

    get messageType(): string { return this.metaData.item("messageType"); }
    get messageId(): string { return this.metaData.item("messageId"); }
    get conversationId(): string { return this.metaData.item("conversationId"); }
    get correlationId(): string { return this.metaData.item("correlationId"); }
    get replyTo(): string { return this.metaData.item("replyTo"); }
    get shouldTerminatePipeline(): boolean { return !!(this.metaData.item("shouldTerminatePipeline")); }

    set messageType(messageType: string) { this.metaData.update("messageType", messageType); }
    set messageId(messageId: string) { this.metaData.update("messageId", messageId); }
    set conversationId(conversationId: string) { this.metaData.update("conversationId", conversationId); }
    set correlationId(correlationId: string) { this.metaData.update("correlationId", correlationId); }
    set replyTo(replyTo: string) { this.metaData.update("replyTo", replyTo); }
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
        this.pipeline.publishInternal(message, new MessageHandlerContext(this.pipeline, this.metaData));
    }

    send<T>(message: IMessage<T>): void {

    }

    reply<T>(reply: T): void {
        var msg = { type: this.messageType + ".reply", message: reply };
        this.pipeline.publishInternal(msg, new MessageHandlerContext(this.pipeline, this.metaData));
    }
}

class Guid {
    private static sUniqueIdCount = 0;
    static newGuid(): string {
        Guid.sUniqueIdCount++;
        return Guid.sUniqueIdCount.toString();
    }
}

export interface IMessageTask {
    invoke(message: IMessage<any>, context: MessageHandlerContext, next: any);
}

export class MessageExceptionTask implements IMessageTask {
    invoke(message: IMessage<any>, context: MessageHandlerContext, next: any) {
        try {
            next();
        } catch (error) {
            message.metaData = context.metaData;
            context.publish({ type: MessageException.typeName, message: new MessageException(error, message) });
        }
    }
}

export class MessagePipeline {
    private _messageTypes = new Hashtable<Array<SubscriptionInstance>>();
    private _messageTasks = new MessageTasks([]);
    private _replyToMessages = new Hashtable<IMessage<any>>();

    private _config = {
        tracking: false,
        useConventions: true,

    };

    constructor() {
        this.messageTasks.add(new MessageExceptionTask());
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

    send<T>(message: IMessage<T>): Promise<any> {
        // Find any subscribers for this message
        var subscribers = this.messageTypes.item(message.type) || [];

        if (subscribers.length > 1) {
            throw new TypeError("Commands must have only one subscriber.")
        } else if (subscribers.length === 0) {
            throw new TypeError("No subscriber defined for this command.");
        }

        let context = new MessageHandlerContext(this);
        if (!message.metaData) {
            message.metaData = new Hashtable<any>();
        }
        let replyTo = Guid.newGuid();
        message.metaData.update("replyTo", replyTo);

        // **** THIS IS A BIT OF A HACK AND SHOULD BE REFACTORED
        // **** FOR A BETTER SOLUTION USING YIELD
        // Subscribe to the result of this message
        this.subscribe({
            messageType: message.type + ".reply", handler: (message: any, context: MessageHandlerContext) => {
                this._replyToMessages.update(context.replyTo, message);
            }
        });

        this.dispatchMessageToSubscribers(message, context, subscribers);
        let promise = new Promise<any>((resolve, reject) => {
            let retries = 100;
            var retry = () => {
                let msg = this._replyToMessages.item(replyTo);
                if (msg) {
                    resolve(msg);
                } else if (retries <= 0) {
                    reject("Reply for message: " + message.type + " did not return in time.");
                } else {
                    retries--;
                    setTimeout(retry, 5);
                }
            }
            retry();
        });

        return promise;
    }

    /*
    
            let promise = new Promise<any>((resolve, reject) => {
                let retries = 100;
                var retry = () => {
                    let msg = this._replyToMessages.item(replyTo);
                    if (msg) {
                        resolve(msg);
                    } else if (retries <= 0) {
                        reject("Reply for message: " + message.type + " did not return in time.");
                    } else {
                        retries--;
                        setTimeout(retry, 5);
                    }
                }
                retry();
            });
    
            return promise;
    
    
    */
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
        return null;
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

        // CorrelationId becomes the current messageId
        newContext.correlationId = context.messageId;
        newContext.messageId = Guid.newGuid();
        newContext.messageType = message.type;
        for (let subscription of subscribers) {
            this.ExecuteMessageTasks(message, newContext, this.messageTasks.localInstance, subscription);
        }

    }
    // TODO: Need to wrap pipeline in async call
    ExecuteMessageTasks(message: IMessage<any>, context: MessageHandlerContext, tasks: MessageTasks, subscription: SubscriptionInstance) {
        let task = tasks.next;
        task.invoke(message, context,  async () => {
            if (tasks.next != null && !context.shouldTerminatePipeline) {
                this.ExecuteMessageTasks(message, context, tasks, subscription);
            }
            else {
                let result = subscription.messageSubscription.handler(message.message, context);

                // determine if the handler is using a promise and if so wait for it to complete
                if (result && 'then' in result) {
                    await result;
                }
            }
        });
    }

    unregisterAll(): void {
        this.messageTypes.clear();
    }
}

export class Utils {
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    };
}

