import * as chai from "chai";
import * as sinon from "sinon";

import { InMemoryStorageQueue } from '../App/Transports/InMemoryStorageQueue'
import { QueuedMessage } from '../App/QueuedMessage'
import TimeSpan from '../App/Timespan'
import { Utils } from '../App/Utils'

const should = chai.should();

describe('Adding a message to the queue', () => {
    let queue = new InMemoryStorageQueue();
    let msg: QueuedMessage;
    let dateNowSub: sinon.SinonStub;

    before(() => {
        // Must override Date.now BEFORE creating a message
        dateNowSub = sinon.stub(Date, "now");
        dateNowSub.returns(100);

        msg = new QueuedMessage("test.message", "Hello World!");
        queue.addMessageAsync(msg);
    })

    after(() => {
        dateNowSub.restore();
    });

    it("should increment the message count on queue by 1", () => {
        queue.count.should.be.equal(1);
    });

    it("should set the message type to the supplied type", () => {
        msg.type.should.be.equal("test.message");
    });

    it("should set the message timestamp to the current time", () => {
        // Between now and 50ms ago
        const now = Date.now();
        msg.timestamp.should.be.equal(now);
    });

    it("should set the messageId to a unique Guid", () => {
        msg.id.should.exist;
    });

    it("should set the deliverAt to zero meaning to deliver immediately", () => {
        msg.deliverAt.should.be.equal(0);
    });
});


describe('Getting a message from the queue', () => {
    let returnedMessage: QueuedMessage;
    let queue = new InMemoryStorageQueue();
    let dateNowSub: sinon.SinonStub;

    before(() => {
        dateNowSub = sinon.stub(Date, "now");
        dateNowSub.returns(100);
        queue.leasePeriod = TimeSpan.FromMilliseconds(10);
        let msg = new QueuedMessage("test.message", "Hello World!");
        queue.addMessageAsync(msg);
        returnedMessage = queue.getMessage();
    });

    beforeEach(() => {
    });

    after(() => {
        dateNowSub.restore();
    });

    it("should return the message", () => {
        returnedMessage.should.exist;
    });

    it("make the message unavailable to other consumers for the configured lease period", () => {
        var nextMessage = queue.getMessage();
        should.not.exist(nextMessage);
    });

    it("should return the message back to the queue after the lease period has completed", async () => {
        // Fast forward the time by 100ms!
        dateNowSub.returns(Date.now() + 100);

        var nextMessage = queue.getMessage();
        nextMessage.should.exist;
    });

    it("should set the dequeue count to 1 when first dequeued", () => {
        returnedMessage.dequeueCount.should.be.equal(1);
    });

    it("should increment the dequeue count on each subsequent dequeue", () => {
        let newQueue = new InMemoryStorageQueue();
        let testMsg = new QueuedMessage("test.message", "Hello World!");
        newQueue.addMessageAsync(testMsg);
        for (let i = 0; i < 5; i++) {
            var dequeuedMsg = newQueue.getMessage();
            newQueue.abandonMessageAsync(dequeuedMsg.id);
            dequeuedMsg.dequeueCount.should.be.equal(i + 1);
        }
    });
})

describe('Completing a message', () => {
    let queue = new InMemoryStorageQueue();
    let msg = new QueuedMessage("test.message", "Hello World!");
    queue.addMessageAsync(msg);
    queue.leasePeriod = TimeSpan.FromMilliseconds(100);
    let dequeuedMsg = queue.getMessage();
    dequeuedMsg.should.exist;
    queue.completeMessageAsync(dequeuedMsg.id);
    dequeuedMsg = queue.getMessage();

    it("should remove the message permanently from the queue", () => {
        should.not.exist(dequeuedMsg);
    });

    it("should reduce the message count by 1", () => {
        queue.count.should.be.equal(0);
    });
})

describe('Abandoning a message', () => {
    let queue = new InMemoryStorageQueue();
    let msg = new QueuedMessage("test.message", "Hello World!");
    queue.addMessageAsync(msg);

    it("should return the message back to the queue immediately", () => {
        // First dequeue msg to make it unavailable
        let dequeuedMsg = queue.getMessage();
        dequeuedMsg.should.exist;

        // Validate that the message is unavailable
        let dequeuedMsg2 = queue.getMessage();
        should.not.exist(dequeuedMsg2);

        // Abandon message making it available again
        queue.abandonMessageAsync(dequeuedMsg.id);
        dequeuedMsg = queue.getMessage();
        dequeuedMsg.should.exist;
    });
})

describe('Renewing a message lease', () => {
    it("should extend the time the message is leased (not available) for the time period specified", async () => {
        let queue = new InMemoryStorageQueue();
        queue.leasePeriod = TimeSpan.FromMilliseconds(30);
        let msg = new QueuedMessage("test.message", "Hello World!");
        queue.addMessageAsync(msg);

        let dequeuedMsg = queue.getMessage();
        dequeuedMsg.should.exist;
        dequeuedMsg = queue.getMessage();
        should.not.exist(dequeuedMsg);
        await Utils.sleep(30);
        dequeuedMsg = queue.getMessage();
        dequeuedMsg.should.exist;

        // Now extend the lease
        queue.renewLease(dequeuedMsg.id, TimeSpan.FromMinutes(1));
        dequeuedMsg = queue.getMessage();
        should.not.exist(dequeuedMsg);
    });
})

describe('Adding an onMessage handler', () => {

    it("should provide new messages added to queue", () => {
        let queue = new InMemoryStorageQueue();
        queue.leasePeriod = TimeSpan.FromMilliseconds(30);

        let messageCount = 0;
        let handler = (message: QueuedMessage) => {
            messageCount++;
            // Mark the message as consumed - otherwise the same message will be delivered again!
            queue.completeMessageAsync(message.id);
        };

        queue.onMessage(handler);
        // Add several messages
        let expectedMessageCount = 5;
        for (let i = 1; i <= expectedMessageCount; i++) {
            queue.addMessageAsync(new QueuedMessage("test.message", "Hello World!"));
        }

        messageCount.should.be.equal(expectedMessageCount);
    });

    it("should provide deferred messages when the time up expires", async () => {
        let queue = new InMemoryStorageQueue();
        queue.leasePeriod = TimeSpan.FromMilliseconds(30);
        let msg = new QueuedMessage("test.message", "Hello World!");

        let messageCount = 0;
        let handler = (message: QueuedMessage) => {
            messageCount++;
            // Mark the message as consumed - otherwise the same message will be delivered again!
            queue.completeMessageAsync(message.id);
        };

        queue.onMessage(handler);
        // Add several messages
        queue.addMessageAsync(msg, TimeSpan.FromMilliseconds(20));
        messageCount.should.be.equal(0);
        await Utils.sleep(50);
        messageCount.should.be.equal(1);
    });
})

describe('Peeking a message', () => {
    let queue = new InMemoryStorageQueue();
    queue.addMessageAsync(new QueuedMessage("test.message", "Hello World!"));

    it("should return the next available message", () => {
        var peek = queue.peekMessage();
        peek.should.exist;
    });

    it("should not prevent the message from being returned by a getMessage call", () => {
        let message = queue.getMessage();
        message.should.exist;
    });
});
