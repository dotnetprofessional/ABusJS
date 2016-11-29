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

    clear() {
        this.internalQueue.clear();
    }

    addMessageAsync(message: StorageMessage) {
        this.internalQueue.add(message.messageId, message);
    }

    getMessageAsync(): StorageMessage {
        for (let i = 0; i < this.internalQueue.count; i++) {
            let key = this.internalQueue.keys[i];
            if (key) {
                var msg = this.internalQueue.item(key);
                // Don't deliver messages that have been deferred
                if (msg.deliverAt <= Date.now()) {
                    // Need to clone message to prevent consumer affecting the
                    // the operation of the queue.
                    return msg.clone();
                }
            }
        }

        // No messages that haven't been derred are available
        return null;
    }

    completeMessageAsync(messageId: string) {
        this.internalQueue.remove(messageId);
    }

    renewLeaseAsync(messageId: string, timeSpan: TimeSpan) {
        let message = this.internalQueue.item(messageId);
        if (!message) {
            throw new TypeError("Unable to locate message with id: " + messageId);
        }
        message.deliverAt = timeSpan.getDateTime();
        // Update the message with new details
        this.internalQueue.update(messageId, message);
        // If its deemed necessary to return the message it should be a clone
    }
}

export class StorageMessage {
    constructor(public readonly type, public readonly message: any) {
        this.messageId = Guid.newGuid();
        this.timestamp = Date.now();
    }

    public messageId: string;
    public timestamp: number;
    public dequeueCount: number;
    public deliverAt: number;

    getMessage<T>(): T {
        return this.message as T;
    }

    clone(): StorageMessage {
        var msg = new StorageMessage(this.type, this.message);
        msg.messageId = this.messageId;
        msg.timestamp = this.timestamp;
        msg.deliverAt = this.deliverAt;

        return msg;
    }
}
