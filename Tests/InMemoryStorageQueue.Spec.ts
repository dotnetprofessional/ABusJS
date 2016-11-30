import { InMemoryStorageQueue, StorageMessage } from '../StorageQueue'
import TimeSpan from '../TimeSpan'
import { Utils } from '../Abus'

describe('Adding a message to the queue', () => {
    let queue = new InMemoryStorageQueue();
    let msg = new StorageMessage("test.message", "Hello World!");
    queue.addMessageAsync(msg);

    it("should increment the message count on queue by 1", () => {
        expect(queue.getCount()).toBe(1);
    });

    it("should set the message type to the supplied type", () => {
        expect(msg.type).toBe("test.message");
    });

    it("should set the message timestamp to the current time", () => {
        // Between now and 50ms ago
        expect(msg.timestamp).toBeGreaterThan(Date.now() - 50);
        expect(msg.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it("should set the messageId to a unique Guid", () => {
        expect(msg.messageId).toBeTruthy;
    });

    it("should set the deliverAt to zero meaning to deliver immediately", () => {
        expect(msg.deliverAt).toBe(0);
    });
});

describe('Getting a message from the queue', () => {
    let queue = new InMemoryStorageQueue();
    let msg = new StorageMessage("test.message", "Hello World!");
    queue.addMessageAsync(msg);
    queue.leasePeriod = TimeSpan.FromMilliseconds(50);
    let returnedMessage = queue.getMessageAsync();

    it("should return the message", () => {
        expect(returnedMessage).toBeTruthy;
    });

    it("make the message unavailable to other consumers for the configured lease period", () => {
        var nextMessage = queue.getMessageAsync();
        expect(nextMessage).toBeFalsy;
    });

    it("should return the message back to the queue after the lease period has completed", () => {
        Utils.sleep(60);

        var nextMessage = queue.getMessageAsync();
        expect(nextMessage).toBeTruthy;
    });

    it("should set the dequeue count to 1 when first dequeued", () => {
        expect(returnedMessage.dequeueCount).toBe(1);
    });

    it("should increment the dequeue count on each subsequent dequeue", () => {
        let newQueue = new InMemoryStorageQueue();
        debugger;
        let testMsg = new StorageMessage("test.message", "Hello World!");
        newQueue.addMessageAsync(testMsg);
        for (let i = 0; i < 5; i++) {
            var dequedMsg = newQueue.getMessageAsync();
            newQueue.abandonMessageAsync(dequedMsg.messageId);
            expect(dequedMsg.dequeueCount).toBe(i + 1);
        }
    });
})

describe('Completing a message', () => {
    let queue = new InMemoryStorageQueue();
    let msg = new StorageMessage("test.message", "Hello World!");
    queue.addMessageAsync(msg);
    queue.leasePeriod = TimeSpan.FromMilliseconds(20);

    it("should remove the message permanently from the queue", () => {
        let msg = queue.getMessageAsync();
        expect(msg).toBeTruthy;
        queue.completeMessageAsync(msg.messageId);
        Utils.sleep(30);
        msg = queue.getMessageAsync();
        expect(msg).toBeFalsy;
    });
})

describe('Abandoing a message', () => {
    let queue = new InMemoryStorageQueue();
    let msg = new StorageMessage("test.message", "Hello World!");
    queue.addMessageAsync(msg);

    it.skip("should return the message back to the queue immediately", () => {
        // First deque msg to make it unavailable
        let dequedMsg = queue.getMessageAsync();
        expect(dequedMsg).toBeTruthy;

        // Validate that the message is unavailable
        let dequedMsg2 = queue.getMessageAsync();
        expect(dequedMsg2).toBeFalsy;

        // Abandon message making it available again
        queue.abandonMessageAsync(dequedMsg.messageId);
        dequedMsg = queue.getMessageAsync();
        expect(dequedMsg).toBeTruthy;
    });
})

describe('Renewing a message lease', () => {
    it.skip("should extend the time the message is leased (not available) for the time period specified", () => {
    });
})

