import { IMessageTransport } from './IMessageTransport'
import TimeSpan from '../Timespan'
import Hashtable from '../Hashtable'
import { InMemoryStorageQueue } from './InMemoryStorageQueue'
import { IMessage } from '../IMessage'
import { QueuedMessage } from '../QueuedMessage'
import { Subscription } from '../Subscription'
import { MetaData, Intents } from '../MetaData'
import { Guid } from "../Guid";

export class LocalTransport implements IMessageTransport {
    // Key = QueueEndpoint.fullname, value = subscription name
    private _subscriptionsByName: Hashtable<Subscription> = new Hashtable<Subscription>();
    private _subscriptionsByFilter: Hashtable<Subscription[]> = new Hashtable<Subscription[]>();
    private _internalQueue = new InMemoryStorageQueue();
    private _onMessageHandler: (message: IMessage<any>) => void = null;
    private _hasSubTypeSubscriptions: boolean;

    constructor() {
        // Setup message pump from InMemoryStorageQueue
        var proc = this.processIncomingQueueMessage.bind(this);
        this._internalQueue.onMessage(proc);
    }

    public publish(message: IMessage<any>): void {
        this.sendMessageToQueue(message);
    }

    public send(message: IMessage<any>, timeToDelay?: TimeSpan): void {
        this.sendMessageToQueue(message, timeToDelay);
    }

    public subscribe(name: string, filter: string): void {
        if (!name) {
            throw new TypeError("Invalid subscription name.");
        }

        if (!filter) {
            throw new TypeError("Invalid filter parameter.");
        }

        if (this._subscriptionsByName.contains(name)) {
            throw new TypeError(`Subscription with name ${name} already exists.`)
        }
        let subscription = new Subscription(name, filter);
        // This is only used to ensure we dont get duplicate subscription names
        // may refactor to iterate on subscription instead.
        this._subscriptionsByName.add(name, subscription);

        // Each filter can have 1..n subscriptions
        let filterSubscriptions = this._subscriptionsByFilter.item(filter);
        if (!filterSubscriptions) {
            filterSubscriptions = [];
            this._subscriptionsByFilter.add(filter, filterSubscriptions);
        }

        // Add new subscription
        filterSubscriptions.push(subscription);

        // Optimization
        if (!this._hasSubTypeSubscriptions) {
            this._hasSubTypeSubscriptions = filter.indexOf("*") > 0;
        }
    }

    public unsubscribe(name: string): void {
        var subscription = this._subscriptionsByName.item(name);
        this._subscriptionsByName.remove(subscription.name);
        var subscribers = this._subscriptionsByFilter.item(subscription.filter);
        // [GM] This is a hack that needs to be cleaned up later
        let newCopy: Subscription[] = [];
        subscribers.forEach(s => {
            if (s.name !== subscription.name) {
                newCopy.push(s);
            }
        });
        if (newCopy.length === 0) {
            // remove filter completely
            this._subscriptionsByFilter.remove(subscription.filter);
        } else {
            this._subscriptionsByFilter.update(subscription.filter, newCopy);
        }
    }

    public unsubscribeAll() {
        this._subscriptionsByName.clear();
        this._subscriptionsByFilter.clear();
    }

    public subscriberCount(filter: string) {
        let subscribers = this._subscriptionsByFilter.item(filter);
        if (subscribers) {
            return subscribers.length;
        } else {
            return 0;
        }
    }

    public completeMessageAsync(messageId: string) {
        let internalMessage = this._internalQueue.findMessage(m => m.metaData.item("messageId") === messageId);
        this._internalQueue.completeMessageAsync(internalMessage.id);
    }

    public onMessage(handler: (message: IMessage<any>) => void) {
        this._onMessageHandler = handler;
    }

    private sendMessageToQueue(message: IMessage<any>, deliverIn?: TimeSpan) {
        // Call the handler for each registered subscription
        // Find any subscribers for this message
        var subscribers = this._subscriptionsByFilter.item(message.type) || [];

        let transportMessage = new QueuedMessage(message.type, message.message, message.metaData);

        // There may also be subscribers that subscribed to a subtype, but only if the message was
        // published can there be any additional subscribers.
        // Sending a message directly on the transport will result in no-metadata so default to publish
        if (!message.metaData || message.metaData.intent === Intents.publish) {
            subscribers = subscribers.concat(this.getStartsWithSubscribers(message.type) || []);
            subscribers = subscribers.concat(this.getEndsWithSubscribers(message.type) || []);

            subscribers.forEach(s => {
                // Clone message prior to sending so each subscriber has their own immutable copy
                let clone = transportMessage.clone();
                // Ensure each copy has a unique id
                clone.id = Guid.newGuid();
                clone.metaData.add("subscription", s.name);
                this._internalQueue.addMessageAsync(clone, deliverIn);
            });

        } else {
            // This scenario is for messages that have a sent intent.
            if (subscribers.length > 0) {
                transportMessage.metaData.add("subscription", subscribers[0].name);
                this._internalQueue.addMessageAsync(transportMessage, deliverIn);
            }
        }


    }

    private getStartsWithSubscribers(messageType: string): Subscription[] {
        var subTypes = messageType.split('.');
        var subscribers = [] as Subscription[];
        var searchType = '';
        for (let i = 0; i < subTypes.length - 1; i++) {
            searchType += subTypes[i] + '.';
            subscribers = subscribers.concat(this._subscriptionsByFilter.item(searchType + '*') || []);
        }

        return subscribers;
    }

    private getEndsWithSubscribers(messageType: string): Subscription[] {
        var subTypes = messageType.split('.');
        var subscribers = [] as Subscription[];
        var searchType = '';
        for (let i = subTypes.length - 1; i >= 0; i--) {
            searchType += '.' + subTypes[i];
            subscribers = subscribers.concat(this._subscriptionsByFilter.item("*" + searchType) || []);
        }

        return subscribers;
    }

    private processIncomingQueueMessage(message: QueuedMessage): void {
        if (this._onMessageHandler) {
            let msg: IMessage<any> = { type: message.type, message: message.body };
            msg.metaData = new MetaData(message.metaData.internalHash());

            // Add some metaData from the QueuedMessage
            msg.metaData.dequeueCount = message.dequeueCount;
            // Send the message to subscribers
            this._onMessageHandler(msg);
        }
    }
}