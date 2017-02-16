import { Bus } from '../App/Bus'
import { MessageHandlerContext } from '../App/MessageHandlerContext'
import { IMessageHandlerContext } from '../App/IMessageHandlerContext'
import { ThreadingOptions } from '../App/MessageHandlerOptions'
import { Utils } from '../App/Utils'

import * as testData from './ABus.Sample.Messages'

describe("Publish method", () => {

    describe("publishing a message outside of a handler", () => {
        var bus = Bus.instance;
        var returnedMessage: testData.CustomerData;
        var currentHandlerContext: IMessageHandlerContext;
        var counter = 0;

        bus.subscribe({
            messageFilter: testData.TestMessage.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                returnedMessage = message;
                currentHandlerContext = context;
            }
        }, { threading: ThreadingOptions.Single });

        bus.subscribe({
            messageFilter: testData.TestMessage2.TYPE,
            handler: async (message: testData.CustomerData, context: MessageHandlerContext) => {
                returnedMessage = message;
                currentHandlerContext = context;
                await Utils.sleep(5);
                // Now set the counter
                counter = 10;
            }
        });

        it("should send message to all registered subscribers", () => {
            bus.publish(new testData.TestMessage("Johhny Smith"));
            expect(returnedMessage.name).toBe("Johhny Smith");
        });

        it("should add a messageHandlerContext to the handler recieving message being sent", () => {
            bus.publish(new testData.TestMessage("Johhny Smith"));
            expect(currentHandlerContext).toBeDefined();
        });

        it("should add messageType to messageHandlerContext", () => {
            expect(currentHandlerContext.messageType).toBe(testData.TestMessage.TYPE);
        });

        it("should add messageId to messageHandlerContext", () => {
            expect(currentHandlerContext.messageId).toBeDefined();
        });

        it("should set the conversationId on messageHandlerContext", () => {
            expect(currentHandlerContext.metaData.conversationId).toBeDefined();
        });

        it("should set the correlationId on messageHandlerContext to undefined", () => {
            // Messages outside of a handler are not part of an existing conversation
            expect(currentHandlerContext.metaData.correlationId).toBeUndefined();
        });

        it("should be fully async and return before subscribers have processed the message", async () => {
            counter = 0;
            bus.publish(new testData.TestMessage2("test"));
            expect(counter).toBe(0);
            await Utils.sleep(30);
            expect(counter).toBe(10);
        });

        //[GM] This is broken
        it("should not throw an exception if subscriber throws an exception", async () => {
            // subscribe to a msg that will then fail during its processing.
            let msg = null;
            bus.unregisterAll();
            bus.subscribe({
                messageFilter: testData.TestMessage.TYPE,
                handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                    msg = message;
                    throw new TypeError("Boom!!");
                }
            });
            bus.subscribe({
                messageFilter: testData.TestMessage.TYPE,
                handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                    msg = message;
                    throw new TypeError("Boom!!");
                }
            });

            bus.publish({ type: testData.TestMessage.TYPE, message: new testData.TestMessage("DEBUG ME") });
            await Utils.sleep(10)
            // by this point no error should have occured and the message handler was called
            expect(msg).toBeDefined();
        });
    });

    describe("publishing a message inside of a handler", () => {
        var bus = new Bus();
        var firstMessage: testData.CustomerData;
        var firstHandlerContext: IMessageHandlerContext;

        var secondMessage: testData.CustomerData;
        var secondHandlerContext: IMessageHandlerContext;

        bus.subscribe({
            messageFilter: testData.TestMessage.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                firstMessage = message;
                firstHandlerContext = context;
                context.publish(new testData.TestMessage2("second message"));
            }
        });

        bus.subscribe({
            messageFilter: testData.TestMessage2.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                secondMessage = message;
                secondHandlerContext = context;
            }
        });

        bus.publish(new testData.TestMessage("Johhny Smith"));

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
            expect(secondHandlerContext.metaData.conversationId).toBeDefined();
            expect(secondHandlerContext.metaData.conversationId).toBe(firstHandlerContext.metaData.conversationId);
        });

        it("should set the correlationId on messageHandlerContext to the messageId of the original message", () => {
            expect(secondHandlerContext.messageType).toBe("test.message2");
            expect(secondHandlerContext.metaData.correlationId).toBeDefined();
            expect(secondHandlerContext.metaData.correlationId).toBe(firstHandlerContext.messageId);
        });
    });

    describe("publishing a message inside of a handler using derived message", () => {
        var bus = new Bus();
        var firstMessage: testData.CustomerData;
        var firstHandlerContext: IMessageHandlerContext;

        var secondMessage: testData.CustomerData;
        var secondHandlerContext: IMessageHandlerContext;

        bus.subscribe({
            messageFilter: testData.TestMessage.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                firstMessage = message;
                firstHandlerContext = context;
                context.publish(new testData.CustomerData2("second message"));
            }
        });

        bus.subscribe({
            messageFilter: testData.CustomerData2.TYPE,
            handler: (message: testData.CustomerData2, context: MessageHandlerContext) => {
                debugger;
                secondMessage = message;
                secondHandlerContext = context;
            }
        });

        bus.publish(new testData.CustomerData("Johhny Smith"));

        it("should send message to all registered subscribers", () => {
            return Utils.sleep(10)
                .then(() => {
                    expect(secondHandlerContext.messageType).toBe(testData.CustomerData2.TYPE);
                    expect(secondMessage.name).toBe("second message");
                });
        });
    });

   it.skip("should not send the message if the timeout has been reached for a persisted message", () => {
        // This test only makes sense once persistent timers have been implemented.
    });
});