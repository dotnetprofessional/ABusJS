import TimeSpan from './TimeSpan'
import Hashtable from './Hashtable'
import {QueuedMessage} from './QueuedMessage'
import {IMessageQueue} from './IMessageQueue'

/**
 * An in memory implementation of the StorageQueue interface
 * 
 * @export
 * @class Queue
 */
export class InMemoryStorageQueue implements IMessageQueue {
    private internalQueue: Hashtable<QueuedMessage> = new Hashtable<QueuedMessage>();
    private _leasePeriod = TimeSpan.FromMinutes(1);
    private _handler: (message: QueuedMessage) => void;
    private _nextScheduledPumpToken: any;

    clear() {
        this.internalQueue.clear();
    }

    set leasePeriod(period: TimeSpan) {
        this._leasePeriod = period;
    }

    get leasePeriod(): TimeSpan {
        return this._leasePeriod;
    }

    addMessageAsync(message: QueuedMessage, deliverIn?: TimeSpan) {
        // Update deliverAt if deliverIn specified
        if (deliverIn) {
            message.deliverAt = deliverIn.getDateTime();
        }

        this.internalQueue.add(message.messageId, message);

        // deliver message if handlers defined.
        this.onMessageProcessor();
    }

    getMessageAsync(): QueuedMessage {
        let message = this.peekMessage();
        if (message) {
            message.dequeueCount += 1;
            return this.renewLeaseAsync(message.messageId, this.leasePeriod);
        }
        // No messages that haven't been derred are available
        return null;
    }

    completeMessageAsync(messageId: string) {
        this.internalQueue.remove(messageId);
    }

    abandonMessageAsync(messageId: string) {
        this.renewLeaseAsync(messageId, TimeSpan.FromMilliseconds(0));
    }
    peekMessage() {
        for (let i = 0; i < this.internalQueue.count; i++) {
            let key = this.internalQueue.keys()[i];
            if (key) {
                var message = this.internalQueue.item(key);
                // Don't deliver messages that have been deferred
                if (message.deliverAt <= Date.now()) {
                    return message;
                }
            }
        }
    }

    onMessage(handler: (message: QueuedMessage) => void) {
        if (this._handler) {
            throw new TypeError('An onMessage handler already exists, only one handler is supported.');
        }
        this._handler = handler;
    }

    private onMessageProcessor() {
        var msg

        // Check if there is a handler defined first
        if (!this._handler) {
            return;
        }

        do {
            msg = this.getMessageAsync();
            if (msg) {
                this._handler(msg);
            }
        } while (msg);

        // Clear any timeouts as a new one will be created later if necessary
        clearTimeout(this._nextScheduledPumpToken);

        // End of messages schedule the next time messages are checked
        if (this.getCount() === 0) {
            // There are no more messages so no need to schedule anything
        } else {
            // There are messages left in the queue but are not available for processing at this time
            // Check the messages that are left and find the one that needs to be processed next and schedule
            // that time for the next pump.
            let nextTimeSlot;
            this.internalQueue.keys().forEach(key => {
                let msg = this.internalQueue.item(key);
                if (!nextTimeSlot || msg.deliverAt < nextTimeSlot) {
                    nextTimeSlot = msg.deliverAt;
                }
            });

            // Schedule next pump and record the timeout token
            this._nextScheduledPumpToken = setTimeout(() => this.onMessageProcessor(), TimeSpan.getTimeSpan(nextTimeSlot).totalMilliseconds);
        }
    }

    renewLeaseAsync(messageId: string, timeSpan: TimeSpan) {
        let message = this.internalQueue.item(messageId);
        if (!message) {
            throw new TypeError("Unable to locate message with id: " + messageId);
        }
        message.deliverAt = timeSpan.getDateTime();
        // Update the message with new details
        this.internalQueue.update(messageId, message);

        return message.clone();
    }

    getCount(): number {
        return this.internalQueue.count;
    }
}


