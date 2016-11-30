import { Guid } from './ABus'
import TimeSpan from './TimeSpan'
import Hashtable from './Hashtable'
/**
 * An in memory implementation of the StorageQueue interface
 * 
 * @export
 * @class Queue
 */
export class InMemoryStorageQueue {
    private internalQueue: Hashtable<StorageMessage> = new Hashtable<StorageMessage>();
    private _leasePeriod = TimeSpan.FromMinutes(1);

    clear() {
        this.internalQueue.clear();
    }

    set leasePeriod(period: TimeSpan) {
        this._leasePeriod = period;
    }

    get leasePeriod(): TimeSpan {
        return this._leasePeriod;
    }

    addMessageAsync(message: StorageMessage) {
        this.internalQueue.add(message.messageId, message);
    }

    getMessageAsync(): StorageMessage {
        for (let i = 0; i < this.internalQueue.count; i++) {
            let key = this.internalQueue.keys()[i];
            if (key) {
                var msg = this.internalQueue.item(key);
                // Don't deliver messages that have been deferred
                if (msg.deliverAt <= Date.now()) {
                    // Extend the lease period by the defined leasePeriod.
                    msg.dequeueCount += 1;
                    return this.renewLeaseAsync(msg.messageId, this.leasePeriod);
                }
            }
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

export class StorageMessage {
    constructor(public readonly type, public readonly message: any) {
        this.messageId = Guid.newGuid();
        this.timestamp = Date.now();
    }

    public messageId: string;
    public timestamp: number;
    public dequeueCount: number = 0;
    public deliverAt: number = 0;

    getMessage<T>(): T {
        return this.message as T;
    }

    clone(): StorageMessage {
        var msg = new StorageMessage(this.type, this.message);
        msg.messageId = this.messageId;
        msg.timestamp = this.timestamp;
        msg.deliverAt = this.deliverAt;
        msg.dequeueCount = this.dequeueCount;

        return msg;
    }
}
