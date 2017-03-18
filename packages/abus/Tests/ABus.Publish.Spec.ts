import * as chai from "chai";
import { Bus } from '../App/Bus'
import { MessageHandlerContext } from '../App/MessageHandlerContext'
import { ThreadingOptions } from '../App/MessageHandlerOptions'
import { Utils } from '../App/Utils'

import * as testData from './ABus.Sample.Messages'

const should = chai.should();

describe("Publish method", () => {

    describe("publishing a message outside of a handler", () => {
        var bus = Bus.instance;
        var returnedMessage: testData.CustomerData;
        var currentHandlerContext: MessageHandlerContext;
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
            returnedMessage.name.should.be.equal("Johhny Smith");
        });

        it("should add a messageHandlerContext to the handler receiving message being sent", () => {
            bus.publish(new testData.TestMessage("Johhny Smith"));
            currentHandlerContext.should.exist;
        });

        it("should add messageType to messageHandlerContext", () => {
            currentHandlerContext.messageType.should.be.equal(testData.TestMessage.TYPE);
        });

        it("should add messageId to messageHandlerContext", () => {
            currentHandlerContext.messageId.should.exist;
        });

        it("should set the conversationId on messageHandlerContext", () => {
            currentHandlerContext.metaData.conversationId.should.exist;
        });

        it("should set the correlationId on messageHandlerContext to undefined", () => {
            // Messages outside of a handler are not part of an existing conversation
            should.not.exist(currentHandlerContext.metaData.correlationId);
        });

        it("should be fully async and return before subscribers have processed the message", async () => {
            counter = 0;
            bus.publish(new testData.TestMessage2("test"));
            counter.should.be.equal(0);
            await Utils.sleep(30);
            counter.should.be.equal(10);
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
            // by this point no error should have occurred and the message handler was called
            msg.should.exist;
        });
    });

    describe("publishing a message inside of a handler", () => {
        var bus = new Bus();
        var firstMessage: testData.CustomerData;
        var firstHandlerContext: MessageHandlerContext;

        var secondMessage: testData.CustomerData;
        var secondHandlerContext: MessageHandlerContext;

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
                    secondHandlerContext.messageType.should.be.equal("test.message2");
                    secondMessage.name.should.be.equal("second message");
                });
        });

        it("should add a messageHandlerContext to the handler receiving message being sent", () => {
            secondHandlerContext.messageType.should.be.equal("test.message2");
            secondHandlerContext.should.exist;
        });

        it("should add messageId to messageHandlerContext which differs from original message", () => {
            secondHandlerContext.messageType.should.be.equal("test.message2");
            secondHandlerContext.messageId.should.exist;
            secondHandlerContext.messageId.should.not.be.equal(firstHandlerContext.messageId);
        });

        it("should set the conversationId on messageHandlerContext to the same as the original message", () => {
            secondHandlerContext.messageType.should.be.equal("test.message2");
            secondHandlerContext.metaData.conversationId.should.exist;
            secondHandlerContext.metaData.conversationId.should.be.equal(firstHandlerContext.metaData.conversationId);
        });

        it("should set the correlationId on messageHandlerContext to the messageId of the original message", () => {
            secondHandlerContext.messageType.should.be.equal("test.message2");
            secondHandlerContext.metaData.correlationId.should.exist;
            secondHandlerContext.metaData.correlationId.should.be.equal(firstHandlerContext.messageId);
        });
    });

    describe("publishing a message inside of a handler using derived message", () => {
        var bus = new Bus();
        var firstMessage: testData.CustomerData;
        var firstHandlerContext: MessageHandlerContext;

        var secondMessage: testData.CustomerData;
        var secondHandlerContext: MessageHandlerContext;

        bus.subscribe({
            messageFilter: testData.CustomerData.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                firstMessage = message;
                firstHandlerContext = context;
                context.publish(new testData.CustomerData2("second message"));
            }
        });

        bus.subscribe({
            messageFilter: testData.CustomerData2.TYPE,
            handler: (message: testData.CustomerData2, context: MessageHandlerContext) => {
                secondMessage = message;
                secondHandlerContext = context;
            }
        });

        bus.publish(new testData.CustomerData("Johhny Smith"));

        it("should send message to all registered subscribers", () => {
            return Utils.sleep(10)
                .then(() => {
                    secondHandlerContext.messageType.should.be.equal(testData.CustomerData2.TYPE);
                    secondMessage.name.should.be.equal("second message");
                });
        });
    });

    describe("publishing a message inside of a handler using derived message with inheritance", () => {
        var bus = new Bus();
        var firstMessage: testData.CustomerData;
        var firstHandlerContext: MessageHandlerContext;

        var secondMessage: testData.MyException;
        var secondHandlerContext: MessageHandlerContext;

        bus.subscribe({
            messageFilter: testData.CustomerData.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                firstMessage = message;
                firstHandlerContext = context;
                let msg = new testData.MyException("It went Boom!");
                context.publish(msg);
            }
        });

        bus.subscribe({
            messageFilter: "Exception.MyException",
            handler: (message: testData.MyException, context: MessageHandlerContext) => {
                secondMessage = message;
                secondHandlerContext = context;
            }
        });

        bus.sendAsync(new testData.CustomerData("Johhny Smith"));

        it("should send message to all registered subscribers", () => {
            // Sleep for 10ms to give the code time to execute handlers
            return Utils.sleep(10)
                .then(() => {
                    secondHandlerContext.messageType.should.be.equal("Exception.MyException");
                    secondMessage.exceptionMessage.should.be.equal("It went Boom!");
                });
        });
    });

    it.skip("should not send the message if the timeout has been reached for a persisted message", () => {
        // This test only makes sense once persistent timers have been implemented.
    });
});