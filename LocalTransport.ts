import { IMessageTransport, QueueEndpoint } from './IMessageTransport'
import TimeSpan from './TimeSpan'
import Hashtable from './Hashtable'
import { IMessageQueue } from './IMessageQueue'
import { InMemoryStorageQueue } from './InMemoryStorageQueue'
import { IMessage } from './IMessage'
import { QueuedMessage } from './QueuedMessage'
import {Subscription} from './Subscription'
import {MetaData} from './MetaData'

export class LocalTransport implements IMessageTransport {
    // Key = QueueEndpoint.fullname, value = subscription name
    private _subscriptionsByName: Hashtable<Subscription> = new Hashtable<Subscription>();
    private _subscriptionsByFilter: Hashtable<Subscription[]> = new Hashtable<Subscription[]>();
    private _internalQueue = new InMemoryStorageQueue();
    private _onMessageHandler: (message: IMessage<any>) => void = null;

    constructor() {
        // Setup message pump from InMemoryStorageQueue
        var proc = this.processIncommingQueueMessage.bind(this);
        this._internalQueue.onMessage(proc);
    }
    publish(message: IMessage<any>): void {
        this.sendMessageToQueue(message);
    }

    send(message: IMessage<any>, timeToDelay?: TimeSpan): void {
        this.sendMessageToQueue(message, timeToDelay);
    }

    subscribe(name: string, filter: string): void {
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
        let filterSubsriptions = this._subscriptionsByFilter.item(filter);
        if (!filterSubsriptions) {
            filterSubsriptions = [];
            this._subscriptionsByFilter.add(filter, filterSubsriptions);
        }

        // Add new subscription
        filterSubsriptions.push(subscription);
    }

    unsubscribe(name: string): void {
        var subscription = this._subscriptionsByName.item(name);
        this._subscriptionsByName.remove(subscription.name);
        var subscribers = this._subscriptionsByFilter.item(subscription.filter);
        // [GM] This is a hack that needs to be cleaned up later
        let newCopy: Subscription[] = [];
        subscribers.forEach(s => {
            if(s.name !== subscription.name) {
                newCopy.push(s);
            } 
        });
        if(newCopy.length === 0) {
            // remove filter completely
            this._subscriptionsByFilter.remove(subscription.filter);
        } else {
            this._subscriptionsByFilter.update(subscription.filter, newCopy);
        }
    }

    unsubscribeAll() {
        this._subscriptionsByName.clear();
        this._subscriptionsByFilter.clear();
    }

    subscriberCount(filter: string) {
        return this._subscriptionsByFilter.item(filter).length;
    }

    onMessage(handler: (message: IMessage<any>) => void) {
        this._onMessageHandler = handler;
    }

    private sendMessageToQueue(message: IMessage<any>, deliverIn?: TimeSpan) {

        // Call the handler for each registered subscription
        // Find any subscribers for this message
        var subscribers = this._subscriptionsByFilter.item(message.type) || [];

        //TODO: [GM] Optimize this so that its only called if at least one subtype was subscribed 
        // There may also be subscribers that subscribed to a subtype
        debugger;
        subscribers = subscribers.concat(this.getStartsWithSubscribers(message.type) || []);
        subscribers = subscribers.concat(this.getEndsWithSubscribers(message.type) || []);

        let transportMessage = new QueuedMessage(message.type, message.message, message.metaData);

        subscribers.forEach(s => {
            // Clone message prior to sending so each subscriber has their own immutable copy
            let clone = transportMessage.clone();
            debugger;
            clone.metaData.add("subscription", s.name);
            this._internalQueue.addMessageAsync(clone, deliverIn);
        });
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
    private processIncommingQueueMessage(message: QueuedMessage): void {
        if (this._onMessageHandler) {
            let msg: IMessage<any> = { type: message.type, message: message.body};
            msg.metaData = new MetaData(message.metaData.internalHash());
            // Send the message to subscribers
            this._onMessageHandler(msg)
        }
    }
}
/*
    NOTES:
    1. The only way to handle durable messages is by either
        a) only support a single handler/subscriber ie only supoprt Commands
        b) create a new copy the message for each registered subscriber (handler) ie Publish
    2. Most messages will be short lived and so want to avoid unnecessary overhead of copying messages if possible
        a) Can still support retry logic witin context of pipeline as each handler is given the same message
            i) However as each handler gets same message supporting dequeCount will require a shallow copy
        b) Exceptions in one handler shouldn't affect the other handlers getting the message
        c) Supporting streamlined message processing will require a single QueueEndpoint
              i) Pipeline only registers a single subscription with Transport
             ii) Advantage of keeping it in transport is that you can add more advanced transports later
            iii) The pipeline can keep track of QueueEndpoint's and the handlers  


Transports:
    1. Are responsible for the message pump
    2. Are responsible for maintaning subscriptions 
        a) Concern is that messages will have to be copied to send to muliple handlers. However, the likelyhood
           that there will be more than 2-3 handlers is low so the overhead of doing a shallow copy is also very low.
           The transport therefore needs to control the subscriptions. This makes the model work well for other transports
           that already handle the pub/sub logic.
        b) From a perf perspective, Redux makes you copy the message for every reducer. However, what needs to be copied
           in this model is only a few attributes.

Message Flow:

Command Pattern
Bus.Send(msg);
  1. Send message to registered transport for sending
     a) Transport adds message to queue or sends to external queuing service
     b) Based on message type configuration sends message to specific transport.
  2. Transport recieves message via message pump for a specific subscription
     a) Hands message to pipeline for distribution to specific handler.
        i) Options are to either register handlers/subscriber with Transport or simply include subscriber identifier with message
       ii) Preference is to include subscription name as part of the returned message assuming each subscription gets its own
           copy of the message (currently preferred method unless perf is poor)

Bus.Subscribe(type, handler);
    1.  Type is mapped to a queue and transport which for InMemory would be a default queue ie all types in one queue. Though its 
        possible to have other queues to simulate a priority queue.
    2. Current possible transports 
        a) InMemory: Messages are copied based on subscriptions at the time message is sent. ie [handler][messages]
        b) Durable: Derives from InMemory but also copies each message to a disk for durability

Bus.Publish(msg);
    1. Same as Bus.Send. The main difference is that Bus.Send may only have a single handler/subscriber. This is enforced 
       by the transport Send method. 

Random
------
A message task could update message context which transport to use by examining other context properties
    ie use x Transport for this subscriber and y transport for another subscriber
    This must happen after the default Transport for this message has been set. However should only apply if
    the transport has been set to InMemory for durable option.

Subscribers/handlers specify if the message is durable or not. The premmis being that only the handler knows how important
it is to ensure the message is processed. Ie in Saga's where there are several steps that need to complete such as downloading/installing
this would require durable messages so that it could continue the process without having to start from the beginning if the app crashed.

Pipeline can have two modes or operation:
    1. Pipeline registers multiple subscriptions with transport which then identifies the subscription the message is for.
    2. Pipeline only registers a single subscription (shared) and distributes the message to all handlers for message.
        a) this option should be able to support limited retries. The dequeue property will not update.
        b) this option may have to complete the message immediately before sending to handlers. Otherwise the message could be delivered
           to the same handler more than once.
        c) Need to benchmark the perf improvement for this option as it has many limitations. 
    3. For simplicity the choice is to start with the Transport handling subscriptions and idenifying the handler to which it
       is for. This allows for wildcard semantics too.

*/