import { InMemoryStorageQueue} from '../InMemoryStorageQueue'
import {Message} from '../Message'
import TimeSpan from '../TimeSpan'
import { Utils } from '../Abus'

describe('Adding a message to the queue', () => {
    let queue = new InMemoryStorageQueue();
    let msg = new Message("test.message", "Hello World!");
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
        expect(msg.messageId).toBeTruthy();
    });

    it("should set the deliverAt to zero meaning to deliver immediately", () => {
        expect(msg.deliverAt).toBe(0);
    });
});

describe('Getting a message from the queue', () => {
    let queue = new InMemoryStorageQueue();
    let msg = new Message("test.message", "Hello World!");
    queue.addMessageAsync(msg);
    queue.leasePeriod = TimeSpan.FromMilliseconds(50);
    let returnedMessage = queue.getMessageAsync();

    it("should return the message", () => {
        expect(returnedMessage).toBeTruthy();
    });

    it("make the message unavailable to other consumers for the configured lease period", () => {
        var nextMessage = queue.getMessageAsync();
        expect(nextMessage).toBeFalsy();
    });

    it("should return the message back to the queue after the lease period has completed", async () => {
        await Utils.sleep(60);

        var nextMessage = queue.getMessageAsync();
        expect(nextMessage).toBeTruthy();
    });

    it("should set the dequeue count to 1 when first dequeued", () => {
        expect(returnedMessage.dequeueCount).toBe(1);
    });

    it("should increment the dequeue count on each subsequent dequeue", () => {
        let newQueue = new InMemoryStorageQueue();
        let testMsg = new Message("test.message", "Hello World!");
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
    let msg = new Message("test.message", "Hello World!");
    queue.addMessageAsync(msg);
    queue.leasePeriod = TimeSpan.FromMilliseconds(100);
    let dequedMsg = queue.getMessageAsync();
    expect(dequedMsg).toBeTruthy();
    queue.completeMessageAsync(dequedMsg.messageId);
    dequedMsg = queue.getMessageAsync();

    it("should remove the message permanently from the queue", () => {
        expect(dequedMsg).toBeFalsy();
    });

    it("should reduce the message count by 1", () => {
        expect(queue.getCount()).toBe(0);
    });
})

describe('Abandoing a message', () => {
    let queue = new InMemoryStorageQueue();
    let msg = new Message("test.message", "Hello World!");
    queue.addMessageAsync(msg);

    it("should return the message back to the queue immediately", () => {
        // First deque msg to make it unavailable
        let dequedMsg = queue.getMessageAsync();
        expect(dequedMsg).toBeTruthy();

        // Validate that the message is unavailable
        let dequedMsg2 = queue.getMessageAsync();
        expect(dequedMsg2).toBeFalsy();

        // Abandon message making it available again
        queue.abandonMessageAsync(dequedMsg.messageId);
        dequedMsg = queue.getMessageAsync();
        expect(dequedMsg).toBeTruthy();
    });
})

describe('Renewing a message lease', () => {
    it("should extend the time the message is leased (not available) for the time period specified", async () => {
        let queue = new InMemoryStorageQueue();
        queue.leasePeriod = TimeSpan.FromMilliseconds(30);
        let msg = new Message("test.message", "Hello World!");
        queue.addMessageAsync(msg);

        let dequedMsg = queue.getMessageAsync();
        expect(dequedMsg).toBeTruthy();
        dequedMsg = queue.getMessageAsync();
        expect(dequedMsg).toBeFalsy();
        await Utils.sleep(30);
        dequedMsg = queue.getMessageAsync();
        expect(dequedMsg).toBeTruthy();

        // Now extend the lease
        queue.renewLeaseAsync(dequedMsg.messageId, TimeSpan.FromMinutes(1));
        dequedMsg = queue.getMessageAsync();
        expect(dequedMsg).toBeFalsy();
    });
})

describe('Adding an onMessage handler', () => {

    it("should provide new messages added to queue", () => {
        let queue = new InMemoryStorageQueue();
        queue.leasePeriod = TimeSpan.FromMilliseconds(30);

        let messageCount = 0;
        let handler = (message: Message) => {
            messageCount++;
            // Mark the message as consumed - otherwise the same message will be delivered again!
            queue.completeMessageAsync(message.messageId);
        };

        queue.onMessage(handler);
        // Add several messages
        let expectedMessageCount = 5;
        for (let i = 1; i <= expectedMessageCount; i++) {
            queue.addMessageAsync(new Message("test.message", "Hello World!"));
        }

        expect(messageCount).toBe(expectedMessageCount);
    });

    it("should provide deferred messages when the time up expires", async () => {
        let queue = new InMemoryStorageQueue();
        queue.leasePeriod = TimeSpan.FromMilliseconds(30);
        let msg = new Message("test.message", "Hello World!");

        let messageCount = 0;
        let handler = (message: Message) => {
            messageCount++;
            // Mark the message as consumed - otherwise the same message will be delivered again!
            queue.completeMessageAsync(message.messageId);
        };

        queue.onMessage(handler);
        // Add several messages
        queue.addMessageAsync(msg, TimeSpan.FromMilliseconds(20));
        expect(messageCount).toBe(0);
        await Utils.sleep(20);
        expect(messageCount).toBe(1);
    });
})

describe('Peeking a meessage', () => {
    let queue = new InMemoryStorageQueue();
    queue.addMessageAsync(new Message("test.message", "Hello World!"));

    it("should return the next available message", () => {
        var peek = queue.peekMessage();
        expect(peek).toBeTruthy();
    });

    it("should not prevent the message from being returned by a getMessage call", () => {
        let message = queue.getMessageAsync();
        expect(message).toBeTruthy();
    });
});
