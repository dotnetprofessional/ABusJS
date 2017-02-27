import { Bus } from '../App/Bus'
import { MessageHandlerContext } from '../App/MessageHandlerContext'
import { Utils } from '../App/Utils'
import TimeSpan from '../App/Timespan'

import * as testData from './ABus.Sample.Messages'

describe("Send method", () => {

    describe("sending a message outside of a handler", () => {
        var bus = new Bus();
        var currentHandlerContext: MessageHandlerContext;

        beforeAll(() => {
            bus.sendAsync(new testData.TestMessage("Johhny Smith"));
        })

        bus.config.useConventions = false;
        bus.subscribe({
            messageFilter: testData.TestMessage.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                currentHandlerContext = context;
            }
        });

        it("should add a messageHandlerContext to the handler receiving message being sent", () => {
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

        it("should set the timestamp on messageHandlerContext to defined", () => {
            // Messages outside of a handler are not part of an existing conversation
            expect(currentHandlerContext.metaData.timestamp).toBeTruthy();
        });

        it("should set the deliverAt on messageHandlerContext to undefined", () => {
            // Messages outside of a handler are not part of an existing conversation
            expect(currentHandlerContext.metaData.deliverAt).toBeGreaterThan(Date.now());
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

        it("should throw SubscriberNotFound exception if no subscriber has registered for message type", () => {
            // need to wrap errors in its own function
            var badMessageHandler = () => {
                bus.sendAsync({ type: testData.TestMessage2.TYPE, message: new testData.TestMessage("") });
            }

            expect(badMessageHandler).toThrowError('No subscriber defined for the command test.message2');
        });

        it("should send to registered subscriber", () => {
            let receivedEvent = false;
            bus.unregisterAll();
            bus.subscribe({
                messageFilter: testData.TestMessage.TYPE,
                handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                    receivedEvent = true;
                }
            });

            bus.sendAsync({ type: testData.TestMessage.TYPE, message: new testData.TestMessage("hhh") });
            return Utils.sleep(50)
                .then(() => {
                    expect(receivedEvent).toBe(true);
                })
                .catch(() => {
                    throw new TypeError("no error should have been caught");
                });
        });

        it("should invoke reply handler after executing message handler", () => {
            let receivedEvent = false;
            bus.unregisterAll();

            bus.subscribe({
                messageFilter: testData.TestMessage.TYPE,
                handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                    receivedEvent = true;
                    context.reply("Hello World!");
                }
            });

            return bus.sendAsync({ type: testData.TestMessage.TYPE, message: new testData.TestMessage("hhh") })
                .then((message: string) => {
                    expect(message).toBe("Hello World!");
                });
        });
    });

    describe("sending a message outside of a handler without a reply", () => {
        var bus = new Bus();
        var currentHandlerContext: MessageHandlerContext;

        bus.config.useConventions = false;
        bus.subscribe({
            messageFilter: testData.TestMessage.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                currentHandlerContext = context;
            }
        });

        it("should add a messageHandlerContext to the handler receiving message being sent", () => {
            bus.send(new testData.TestMessage("Johhny Smith"));
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
                bus.send({ type: testData.TestMessage.TYPE, message: new testData.TestMessage("") });
            }

            expect(badMessageHandler).toThrowError('The command test.message must have only one subscriber.');
        });

        it("should throw SubscriberNotFound exception if no subscriber has registered for message type", () => {
            // need to wrap errors in its own function
            var badMessageHandler = () => {
                bus.send({ type: testData.TestMessage2.TYPE, message: new testData.TestMessage("") });
            }

            expect(badMessageHandler).toThrowError('No subscriber defined for the command test.message2');
        });

        it("should send to registered subscriber", () => {
            let receivedEvent = false;
            bus.unregisterAll();
            bus.subscribe({
                messageFilter: testData.TestMessage.TYPE,
                handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                    receivedEvent = true;
                }
            });

            bus.send({ type: testData.TestMessage.TYPE, message: new testData.TestMessage("hhh") });
            return Utils.sleep(50)
                .then(() => {
                    expect(receivedEvent).toBe(true);
                })
                .catch(() => {
                    throw new TypeError("no error should have been caught");
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
        it("should add a messageHandlerContext to the handler receiving message being sent", () => {
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
            let receivedEvent = false;
            bus.unregisterAll();
            bus.subscribe({
                messageFilter: testData.TestMessage.TYPE,
                handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                    receivedEvent = true;
                }
            });

            bus.sendAsync(new testData.TestMessage("hhh"));
            return Utils.sleep(50)
                .then(() => {
                    expect(receivedEvent).toBe(true);
                })
                .catch(() => {
                    throw new TypeError("no error should have been caught");
                });
        });
    });

    describe("sending a message inside of a handler", () => {
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

        it("should add a messageHandlerContext to the handler receiving message being sent", () => {
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

    describe("sending a message inside of a handler without a reply", () => {
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
                context.send(new testData.TestMessage2("second message"));
            }
        });

        bus.subscribe({
            messageFilter: testData.TestMessage2.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                secondMessage = message;
                secondHandlerContext = context;
            }
        });

        bus.send(new testData.TestMessage("Johhny Smith"));

        it("should send message to all registered subscribers", () => {
            // Sleep for 10ms to give the code time to execute handlers
            return Utils.sleep(10)
                .then(() => {
                    expect(secondHandlerContext.messageType).toBe("test.message2");
                    expect(secondMessage.name).toBe("second message");
                });
        });

        it("should add a messageHandlerContext to the handler receiving message being sent", () => {
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
        var firstHandlerContext: MessageHandlerContext;

        var secondMessage: testData.CustomerData;
        var secondHandlerContext: MessageHandlerContext;

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

    describe("sending a message inside of a handler using derived message with inheritance", () => {
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
                context.sendAsync(msg);
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
                    expect(secondHandlerContext.messageType).toBe("Exception.MyException");
                    expect(secondMessage.exceptionMessage).toBe("It went Boom!");
                });
        });
    });

    describe("sending a deferred message inside of a handler", () => {
        var bus = new Bus();
        var firstMessage: testData.CustomerData;
        var firstHandlerContext: MessageHandlerContext;

        var secondMessage: testData.CustomerData;
        var secondHandlerContext: MessageHandlerContext;
        var deliverIn: TimeSpan;

        bus.subscribe({
            messageFilter: testData.TestMessage.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                firstMessage = message;
                firstHandlerContext = context;
                // defer the sending of the message by 100ms
                deliverIn = new TimeSpan(100);
                context.sendAsync(new testData.TestMessage2("second message"), { deliverIn: deliverIn });
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

            // Now wait a bit longer to for the deliverTo to have elapsed and the message to be delivered
            await Utils.sleep(60);
            expect(secondHandlerContext.messageType).toBe(testData.TestMessage2.TYPE);
            expect(secondMessage.name).toBe("second message");
        });


        it("should set the deliverAt on messageHandlerContext to the deferred time", () => {
            // Messages outside of a handler are not part of an existing conversation
            console.log(secondHandlerContext)
            expect(secondHandlerContext.metaData.deliverAt).toBeTruthy;
        });

    });
});