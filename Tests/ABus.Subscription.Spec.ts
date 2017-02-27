import { Bus } from '../App/Bus'
import { MessageHandlerContext } from '../App/MessageHandlerContext'
import { handler } from '../App/Decorators/handler'
import { iHandleMessages } from '../App/Decorators/iHandleMessages'

import * as testData from './ABus.Sample.Messages'

describe("Subscriptions", () => {

    describe("subscribing to a message type", () => {
        var pipeline = new Bus();

        it("should register subscriber for the message type", () => {
            pipeline.unregisterAll();
            pipeline.subscribe({ messageFilter: testData.TestMessage.TYPE, handler: (message: any, context: MessageHandlerContext) => { } });
            expect(pipeline.subscriberCount(testData.TestMessage.TYPE)).toBe(1);
        });

        it("should throw Invalid subscription exception for null messageHandler", () => {
            pipeline.unregisterAll();

            // need to wrap errors in its own function
            var badMessageHandler = () => {
                pipeline.subscribe(null);
            }

            expect(badMessageHandler).toThrowError('Invalid subscription.');
        });

        it("should throw exception for invalid handler", () => {
            pipeline.unregisterAll();

            // need to wrap errors in its own function
            var badMessageHandler = () => {
                pipeline.subscribe({ messageFilter: "test", handler: null });
            }

            expect(badMessageHandler).toThrowError('messageHandler must be a function');
        });

        it("should throw exception for invalid message type", () => {
            pipeline.unregisterAll();

            // need to wrap errors in its own function
            var badMessageHandler = () => {
                pipeline.subscribe({ messageFilter: null, handler: null });
            }

            expect(badMessageHandler).toThrowError('Invalid messageType');
        });

        it.skip("should publish a subscription created message", () => {
        });
    });

    describe("unsubscribing to a message type", () => {
        var pipeline = new Bus();

        pipeline.subscribe({ messageFilter: testData.TestMessage.TYPE, handler: (message: any) => { } });

        it("removes handler from subscription", () => {
            expect(pipeline.subscriberCount(testData.TestMessage.TYPE)).toBe(1);
            // Add another subscriber
            let subscription = pipeline.subscribe({ messageFilter: testData.TestMessage.TYPE, handler: () => { } });
            expect(pipeline.subscriberCount(testData.TestMessage.TYPE)).toBe(2);

            // Remove the last subscriber
            pipeline.unsubscribe(subscription);
            expect(pipeline.subscriberCount(testData.TestMessage.TYPE)).toBe(1);
        });
    });

    describe("subscribing to a message sub type", () => {
        var pipeline = new Bus();

        it("should receive messages for all message types currently registered with supplied type prefix", () => {
            let counter = 0;
            pipeline.subscribe({
                messageFilter: "test.*", handler: (message: any, context: MessageHandlerContext) => {
                    if (context.messageType === testData.TestMessage.TYPE) {
                        counter += 1;
                    } else {
                        if (context.messageType === testData.TestMessage2.TYPE) {
                            counter += 2;
                        }
                    }
                }
            });

            pipeline.publish({ type: testData.TestMessage.TYPE, message: {} });
            pipeline.publish({ type: testData.TestMessage2.TYPE, message: {} });

            expect(counter).toBe(3);
        });

        it("should receive messages for all message types currently registered with supplied type suffix", () => {
            let counter = 0;
            pipeline.unregisterAll();
            pipeline.subscribe({
                messageFilter: "*.reply", handler: (message: any, context: MessageHandlerContext) => {
                    if (context.messageType === testData.TestMessage1Reply.TYPE) {
                        counter += 1;
                    } else {
                        if (context.messageType === testData.TestMessage2Reply.TYPE) {
                            counter += 2;
                        }
                    }

                    if (context.messageType === testData.TestMessage2.TYPE) {
                        // Ensures this message wasn't received as it wasn't subscribed to
                        counter += 1;
                    }
                }
            });
            pipeline.publish({ type: testData.TestMessage1Reply.TYPE, message: {} });
            pipeline.publish({ type: testData.TestMessage2Reply.TYPE, message: {} });
            pipeline.publish({ type: testData.TestMessage2.TYPE, message: {} });

            expect(counter).toBe(3);
        });
    });

    describe.skip("subscribing to a message with throttling", () => {
        //var pipeline = new Bus();

        it.skip("should only forward messages once per throttle period ", () => {
            // Ie throttle 1 sec should only receive messages every 1 second even if more have arrived

        });

        it.skip("should receive messages for all message types currently registered with supplied type suffix", () => {
            //pipeline.subscribe("*.message1", (message: any) => { });
        });

    });

});

// This class handles messages and needs to be exported to prevent compiler errors about not being used.
@iHandleMessages
export class TestMessageHandler {
    public value = 5;
    constructor(value: number) {
        this.value = value;
    }
    @handler(testData.TestMessage.TYPE)
    handler(message: testData.CustomerData, context: MessageHandlerContext) {
        this.value = 100 + this.value;
    };
}

@iHandleMessages
export class TestMessageHandler2 {
    public value = 5;
    constructor(value: number) {
        this.value = value;
    }

    @handler(testData.CustomerData2)
    handler2(message: testData.CustomerData2, context: MessageHandlerContext) {
        this.value = 100 + this.value;
    };
}

@iHandleMessages
export class TestMessageHandler3 {
    public value = 0;
    constructor(value: number) {
        this.value = value;
    }

    @handler(testData.TestMessage.TYPE)
    handler(message: testData.CustomerData, context: MessageHandlerContext) {
        this.value = 100 + this.value;
    };

    @handler(testData.CustomerData2)
    handler2(message: testData.CustomerData2, context: MessageHandlerContext) {
        this.value = 100 + this.value;
    };
}

@iHandleMessages
export class TestMessageHandlerWithInheritance {
    public value = 0;
    constructor(value: number) {
        this.value = value;
    }

    @handler(testData.MyException)
    handler(message: testData.MyException, context: MessageHandlerContext) {
        this.value = 100 + this.value;
    };
}

describe("subscribing to a message type using decorators", () => {

    describe("using a string literal to define the messageFilter", () => {
        var bus = new Bus().makeGlobal();
        // Provide an instance for the handler to attach to
        let handlerClass = new TestMessageHandler(10);

        it("should register subscriber for the message type", async () => {
            expect(bus.subscriberCount(testData.TestMessage.TYPE)).toBe(1);
        });

        it("should call handler with correct class instance", async () => {
            bus.sendAsync(new testData.TestMessage(""));
            expect(handlerClass.value).toBe(110);
        });

        it("should still have a valid instance of for the class", () => {
            expect(handlerClass instanceof TestMessageHandler).toBeTruthy;
        })
    });

    describe("using the message type to define the messageFilter", () => {
        var bus = new Bus().makeGlobal();
        // Provide an instance for the handler to attach to
        let handlerClass = new TestMessageHandler2(50);

        it("should register subscriber for the message type", async () => {
            expect(bus.subscriberCount("CustomerData2")).toBe(1);
        });

        it("should call handler with correct class instance", async () => {
            bus.sendAsync(new testData.CustomerData2(""));
            expect(handlerClass.value).toBe(150);
        });
    });

    describe("using the message type to define the messageFilter that uses inheritance", () => {
        var bus = new Bus().makeGlobal();
        // Provide an instance for the handler to attach to
        let handlerClass = new TestMessageHandlerWithInheritance(50);

        it("should register subscriber for the message type", async () => {
            expect(bus.subscriberCount("Exception.MyException")).toBe(1);
        });

        it("should call handler with correct class instance", async () => {
            bus.sendAsync(new testData.MyException(""));
            expect(handlerClass.value).toBe(150);
        });
    });

    describe("having multiple handlers using both methods", () => {
        var bus = new Bus().makeGlobal();
        // Provide an instance for the handler to attach to
        let handlerClass = new TestMessageHandler3(30);

        it("should register subscriber for the message type", async () => {
            expect(bus.subscriberCount(testData.TestMessage.TYPE)).toBe(1);
            expect(bus.subscriberCount("CustomerData2")).toBe(1);
        });

        it("should call handlers with correct class instance", async () => {
            bus.sendAsync(new testData.TestMessage(""));
            bus.sendAsync(new testData.CustomerData2(""));
            expect(handlerClass.value).toBe(230);
        });

        it("should remove handlers when calling dynamically defined unsubscribeHandlers", async () => {
            // Verify the subscriptions exist first
            expect(bus.subscriberCount(testData.TestMessage.TYPE)).toBe(1);
            expect(bus.subscriberCount(testData.CustomerData2)).toBe(1);
            // This method is added dynamically so typescript is not aware of it, so need to cast to any
            (handlerClass as any).unsubscribeHandlers();
            expect(bus.subscriberCount(testData.TestMessage.TYPE)).toBe(0);
            expect(bus.subscriberCount(testData.CustomerData2)).toBe(0);
        });
    });
});
