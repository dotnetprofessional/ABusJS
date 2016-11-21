import {
    MessagePipeline,
    MessageHandlerContext,
    IMessage,
    IMessageSubscription,
    IMessageHandlerContext,
    MessageHandlerOptions,
    ThreadingOptions,
    Utils
} from '../ABus';

import * as testData from './ABus.Sample.Messages'

describe("publishing a message outside of a handler", () => {
    var pipeline = new MessagePipeline();
    var returnedMessage: testData.CustomerData;
    var currentHandlerContext: IMessageHandlerContext;
    var counter = 0;

    pipeline.subscribe({
        messageType: testData.TestMessage.TYPE,
        handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
            returnedMessage = message;
            currentHandlerContext = context;
        }
    }, {threading: ThreadingOptions.Single});

    pipeline.subscribe({
        messageType: testData.TestMessage2.TYPE,
        handler: async (message: testData.CustomerData, context: MessageHandlerContext) => {
            returnedMessage = message;
            currentHandlerContext = context;
            await Utils.sleep(5);
            // Now set the counter
            counter = 10;
        }
    });

    it("should send message to all registered subscribers", () => {
        pipeline.publish(new testData.TestMessage("Johhny Smith"));
        expect(returnedMessage.name).toBe("Johhny Smith");
    });

    it("should add a messageHandlerContext to the handler recieving message being sent", () => {
        pipeline.publish(new testData.TestMessage("Johhny Smith"));
        expect(currentHandlerContext).toBeDefined();
    });

    it("should add messageType to messageHandlerContext", () => {
        expect(currentHandlerContext.messageType).toBe(testData.TestMessage.TYPE);
    });

    it("should add messageId to messageHandlerContext", () => {
        expect(currentHandlerContext.messageId).toBeDefined();
    });

    it("should set the conversationId on messageHandlerContext", () => {
        expect(currentHandlerContext.conversationId).toBeDefined();
    });

    it("should set the correlationId on messageHandlerContext to undefined", () => {
        // Messages outside of a handler are not part of an existing conversation
        expect(currentHandlerContext.correlationId).toBeUndefined();
    });

    it("should not throw an exception if subscriber throws an exception", () => {
        // subscribe to a msg that will then fail during its processing.
        pipeline.subscribe({
            messageType: testData.TestMessage.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                throw new TypeError("Boom!!");
            }
        });

        pipeline.publish({ type: testData.TestMessage.TYPE, message: new testData.TestMessage("") });
        return Utils.sleep(10)
            .then(() => { expect(true) })
            .catch(() => {
                throw new TypeError("no error should have been caught");
            })
    });

    it("should be fully async and return before subscribers have processed the message", async () => {
        counter = 0;
        pipeline.publish(new testData.TestMessage2("test"));
        expect(counter).toBe(0);
        await Utils.sleep(30);
        expect(counter).toBe(10);
    });
});


describe("publishing a message inside of a handler", () => {
    var pipeline = new MessagePipeline();
    var firstMessage: testData.CustomerData;
    var firstHandlerContext: IMessageHandlerContext;

    var secondMessage: testData.CustomerData;
    var secondHandlerContext: IMessageHandlerContext;

    pipeline.subscribe({
        messageType: testData.TestMessage.TYPE,
        handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
            firstMessage = message;
            firstHandlerContext = context;
            context.publish(new testData.TestMessage2("second message"));
        }
    });

    pipeline.subscribe({
        messageType: testData.TestMessage2.TYPE,
        handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
            secondMessage = message;
            secondHandlerContext = context;
        }
    });

    pipeline.publish(new testData.TestMessage("Johhny Smith"));

    it("should send message to all registered subscribers", () => {
        return Utils.sleep(10)
            .then(() => {
                expect(secondHandlerContext.messageType).toBe("test.message2");
                expect(secondMessage.name).toBe("second message");
            });
    });

    it("should add a messageHandlerContext to the handler recieving message being sent", () => {
        expect(secondHandlerContext.messageType).toBe("test.message2");
        expect(secondHandlerContext).toBeDefined();
    });

    it("should add messageId to messageHandlerContext which differs from original message", () => {
        expect(secondHandlerContext.messageType).toBe("test.message2");
        expect(secondHandlerContext.messageId).toBeDefined();
        expect(secondHandlerContext.messageId).not.toBe(firstHandlerContext.messageId);
    });

    it("should set the conversationId on messageHandlerContext to the same as the original message", () => {
        expect(secondHandlerContext.messageType).toBe("test.message2");
        expect(secondHandlerContext.conversationId).toBeDefined();
        expect(secondHandlerContext.conversationId).toBe(firstHandlerContext.conversationId);
    });

    it("should set the correlationId on messageHandlerContext to the messageId of the original message", () => {
        expect(secondHandlerContext.messageType).toBe("test.message2");
        expect(secondHandlerContext.correlationId).toBeDefined();
        expect(secondHandlerContext.correlationId).toBe(firstHandlerContext.messageId);
    });
});

describe("publishing a message outside of a handler with ", () => {
    var pipeline = new MessagePipeline();
    var returnedMessage: testData.CustomerData;
    var currentHandlerContext: IMessageHandlerContext;
    var counter = 0;

    pipeline.subscribe({
        messageType: testData.TestMessage.TYPE,
        handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
            returnedMessage = message;
            currentHandlerContext = context;
        }
    }, {threading: ThreadingOptions.Single});

    pipeline.subscribe({
        messageType: testData.TestMessage2.TYPE,
        handler: async (message: testData.CustomerData, context: MessageHandlerContext) => {
            returnedMessage = message;
            currentHandlerContext = context;
            await Utils.sleep(5);
            // Now set the counter
            counter = 10;
        }
    });

    it("should send message to all registered subscribers", () => {
        pipeline.publish(new testData.TestMessage("Johhny Smith"));
        expect(returnedMessage.name).toBe("Johhny Smith");
    });

});