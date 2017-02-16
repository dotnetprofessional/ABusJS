import { Bus } from '../App/Bus'
import { MessageHandlerContext } from '../App/MessageHandlerContext'
import { IMessageHandlerContext } from '../App/IMessageHandlerContext'
import { Utils } from '../App/Utils'
import TimeSpan from '../App/Timespan'

import * as testData from './ABus.Sample.Messages'

describe("Send method", () => {

    describe("sending a message outside of a handler", () => {
        var bus = new Bus();
        var currentHandlerContext: MessageHandlerContext;

        bus.config.useConventions = false;
        bus.subscribe({
            messageFilter: testData.TestMessage.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                currentHandlerContext = context;
            }
        });

        it("should add a messageHandlerContext to the handler recieving message being sent", () => {
            bus.sendAsync(new testData.TestMessage("Johhny Smith"));
            return Utils.sleep(10)
                .then(() => {
                    expect(currentHandlerContext).toBeDefined();
                });
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

        // The replyTo is added once a reply has been sent and will have the id of the originating message
        it("should not add replyTo to messageHandlerContext", () => {
            expect(currentHandlerContext.getMetaDataValue("replyTo")).toBeUndefined();
        });

        it("should verify there is only one subscriber for message type", () => {
            // Subscribe twice for the same message. When attempting to use Send this should fail
            bus.subscribe({
                messageFilter: testData.TestMessage.TYPE,
                handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                }
            });

            bus.subscribe({
                messageFilter: testData.TestMessage.TYPE,
                handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                }
            });

            // need to wrap errors in its own function
            var badMessageHandler = () => {
                bus.sendAsync({ type: testData.TestMessage.TYPE, message: new testData.TestMessage("") });
            }

            expect(badMessageHandler).toThrowError('The command test.message must have only one subscriber.');
        });

        it("should throw SubscriberNotFound exception if no subscriber has registerd for message type", () => {
            // need to wrap errors in its own function
            var badMessageHandler = () => {
                bus.sendAsync({ type: testData.TestMessage2.TYPE, message: new testData.TestMessage("") });
            }

            expect(badMessageHandler).toThrowError('No subscriber defined for the command test.message2');
        });

        it("should send to registered subscriber", () => {
            let recievedEvent = false;
            bus.unregisterAll();
            bus.subscribe({
                messageFilter: testData.TestMessage.TYPE,
                handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                    recievedEvent = true;
                }
            });

            bus.sendAsync({ type: testData.TestMessage.TYPE, message: new testData.TestMessage("hhh") });
            return Utils.sleep(50)
                .then(() => {
                    expect(recievedEvent).toBe(true);
                })
                .catch(() => {
                    throw new TypeError("no error should have been caught");
                });
        });

        it("should invoke reply handler after executing message handler", () => {
            let recievedEvent = false;
            bus.unregisterAll();

            bus.subscribe({
                messageFilter: testData.TestMessage.TYPE,
                handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                    recievedEvent = true;
                    context.reply("Hello World!");
                }
            });

            return bus.sendAsync({ type: testData.TestMessage.TYPE, message: new testData.TestMessage("hhh") })
                .then((message: string) => {
                    expect(message).toBe("Hello World!");
                });
        });
    });

    describe("sending a message outside of a handler using derived message", () => {
        var bus = new Bus();
        var currentHandlerContext: MessageHandlerContext;

        bus.config.useConventions = false;
        bus.subscribe({
            messageFilter: testData.CustomerData.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                currentHandlerContext = context;
            }
        });
        it("should add a messageHandlerContext to the handler recieving message being sent", () => {
            bus.sendAsync(new testData.CustomerData("Johhny Smith"));
            return Utils.sleep(10)
                .then(() => {
                    expect(currentHandlerContext).toBeDefined();
                });
        });

        it("should add messageType to messageHandlerContext", () => {
            expect(currentHandlerContext.messageType).toBe("CustomerData");
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

        // The replyTo is added once a reply has been sent and will have the id of the originating message
        it("should not add replyTo to messageHandlerContext", () => {
            expect(currentHandlerContext.getMetaDataValue("replyTo")).toBeUndefined();
        });

        it("should send to registered subscriber", () => {
            let recievedEvent = false;
            bus.unregisterAll();
            bus.subscribe({
                messageFilter: testData.TestMessage.TYPE,
                handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                    recievedEvent = true;
                }
            });

            bus.sendAsync(new testData.TestMessage("hhh"));
            return Utils.sleep(50)
                .then(() => {
                    expect(recievedEvent).toBe(true);
                })
                .catch(() => {
                    throw new TypeError("no error should have been caught");
                });
        });
    });


    describe("sending a message inside of a handler", () => {
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
                context.sendAsync(new testData.TestMessage2("second message"));
            }
        });

        bus.subscribe({
            messageFilter: testData.TestMessage2.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                secondMessage = message;
                secondHandlerContext = context;
            }
        });

        bus.sendAsync(new testData.TestMessage("Johhny Smith"));

        it("should send message to all registered subscribers", () => {
            // Sleep for 10ms to give the code time to execute handlers
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

    describe("sending a message inside of a handler using derived message", () => {
        var bus = new Bus();
        var firstMessage: testData.CustomerData;
        var firstHandlerContext: IMessageHandlerContext;

        var secondMessage: testData.CustomerData;
        var secondHandlerContext: IMessageHandlerContext;

        bus.subscribe({
            messageFilter: testData.CustomerData.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                firstMessage = message;
                firstHandlerContext = context;
                context.sendAsync(new testData.CustomerData2("second message"));
            }
        });

        bus.subscribe({
            messageFilter: testData.CustomerData2.TYPE,
            handler: (message: testData.CustomerData2, context: MessageHandlerContext) => {
                secondMessage = message;
                secondHandlerContext = context;
            }
        });

        bus.sendAsync(new testData.CustomerData("Johhny Smith"));

        it("should send message to all registered subscribers", () => {
            // Sleep for 10ms to give the code time to execute handlers
            return Utils.sleep(10)
                .then(() => {
                    expect(secondHandlerContext.messageType).toBe(testData.CustomerData2.TYPE);
                    expect(secondMessage.name).toBe("second message");
                });
        });
    });

    describe("sending a defered message inside of a handler", () => {
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
                // defer the sending of the message by 100ms
                context.sendAsync(new testData.TestMessage2("second message"), { deliverIn: new TimeSpan(100) });
            }
        });

        bus.subscribe({
            messageFilter: testData.TestMessage2.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                secondMessage = message;
                secondHandlerContext = context;
            }
        });


        it("should send deferred message to all registered subscribers after time interval", async () => {
            bus.sendAsync(new testData.TestMessage("Johhny Smith"));
            // Wait enough time for the handlers to have executed
            await Utils.sleep(50);
            // Valid that the first message was delivered but the second message hasn't been delivered yet
            expect(firstHandlerContext.messageType).toBe(testData.TestMessage.TYPE);
            expect(firstHandlerContext).toBeDefined();

            expect(secondHandlerContext).toBeFalsy();
            expect(secondMessage).toBeFalsy();

            // Now wait a bit longer to for the deliverTo to have elasped and the message to be delivered
            await Utils.sleep(60);
            expect(secondHandlerContext.messageType).toBe(testData.TestMessage2.TYPE);
            expect(secondMessage.name).toBe("second message");
        });
    });
});