import TimeSpan from './TimeSpan'
import { QueuedMessage } from './QueuedMessage'
import { IMessageQueue } from './IMessageQueue'

/**
 * An in memory implementation of the StorageQueue interface
 * 
 * @export
 * @class Queue
 */
export class InMemoryStorageQueue implements IMessageQueue {
    private internalQueue: QueuedMessage[] = [];
    private _leasePeriod = TimeSpan.FromMinutes(60);
    private _handler: (message: QueuedMessage) => void;
    private _nextScheduledPumpToken: any;

    clear():void {
        this.internalQueue = [];
    }

    set leasePeriod(period: TimeSpan) {
        this._leasePeriod = period;
    }

    get leasePeriod(): TimeSpan {
        return this._leasePeriod;
    }

    addMessageAsync(message: QueuedMessage, deliverIn?: TimeSpan): void {
        // Update deliverAt if deliverIn specified
        if (deliverIn) {
            message.deliverAt = deliverIn.getDateTime();
        }

        this.internalQueue.push(message);

        // deliver message if handlers defined.
        this.onMessageProcessor();
    }

    getMessage(): QueuedMessage {
        let message = this.peekMessage();
        if (message) {
            message.dequeueCount += 1;
            return this.renewLease(message.id, this.leasePeriod);
        }
        // No messages that haven't been derred are available
        return null;
    }

    completeMessageAsync(messageId: string): void {
        let q = this.internalQueue;
        for (let i = 0; i < this.internalQueue.length; i++) {
            if (q[i].id === messageId) {
                // Match found! so now remove it!
                q.splice(i, 1);
                return;
            }
        }
    }

    /**
     * Releases the lease on a message allowing it to return the queue to be processed again.
     * 
     * @param {string} messageId
     * 
     * @memberOf InMemoryStorageQueue
     */
    abandonMessageAsync(messageId: string): void {
        this.renewLease(messageId, TimeSpan.FromMilliseconds(0));
    }

    /**
     * Returns the next available message without taking a lease on it.
     * 
     * @returns {QueuedMessage}
     *  
     * @memberOf InMemoryStorageQueue
     */
    peekMessage(): QueuedMessage {
        for (let i = 0; i < this.internalQueue.length; i++) {
            let message = this.internalQueue[i];
            // Don't deliver messages that have been deferred
            if (!message.deliverAt || message.deliverAt <= Date.now()) {
                return message;
            }
        }
    }

    findMessage(compare: (m:QueuedMessage)=>void): QueuedMessage {
        for (let i = 0; i < this.internalQueue.length; i++) {
            let message = this.internalQueue[i];
            if(compare(message)) {
                return message;
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
            msg = this.getMessage();
            if (msg) {
                // Handler in the transport
                this._handler(msg);
            }
        } while (msg);

        // Clear any timeouts as a new one will be created later if necessary
        clearTimeout(this._nextScheduledPumpToken);

        // End of messages schedule the next time messages are checked
        if (this.count === 0) {
            // There are no more messages so no need to schedule anything
        } else {
            // There are messages left in the queue but are not available for processing at this time
            // Check the messages that are left and find the one that needs to be processed next and schedule
            // that time for the next pump.
            let nextTimeSlot;
            this.internalQueue.forEach(msg => {
                if (!nextTimeSlot || msg.deliverAt < nextTimeSlot) {
                    nextTimeSlot = msg.deliverAt;
                }
            });

            // Schedule next pump and record the timeout token
            this._nextScheduledPumpToken = setTimeout(async () => this.onMessageProcessor(), TimeSpan.getTimeSpan(nextTimeSlot).totalMilliseconds);
        }
    }

    renewLease(messageId: string, timeSpan: TimeSpan) {
        // Locate message and update the deliverAt property
        let q = this.internalQueue;
        for (let i = 0; i < this.internalQueue.length; i++) {
            if (q[i].id === messageId) {
                // Match found!
                q[i].deliverAt = timeSpan.getDateTime();
                return q[i].clone();
            }
        }

        throw new TypeError("Unable to locate message with id: " + messageId);
    }

    get count(): number {
        return this.internalQueue.length;
    }
}


