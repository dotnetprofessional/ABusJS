import { Bus } from '../App/Bus'
import * as chai from "chai";

import { MessageHandlerContext } from '../App/MessageHandlerContext'
import { handler } from '../App/Decorators/handler'
import { handlerForSubType } from '../App/Decorators/handlerForSubType'
import { iHandleMessages } from '../App/Decorators/iHandleMessages'

import * as testData from './ABus.Sample.Messages'
const should = chai.should();

describe("Subscriptions", () => {

    describe("subscribing to a message type", () => {
        var pipeline = new Bus();

        it("should register subscriber for the message type", () => {
            pipeline.unregisterAll();
            pipeline.subscribe({ messageFilter: testData.TestMessage.TYPE, handler: (message: any, context: MessageHandlerContext) => { } });
            pipeline.subscriberCount(testData.TestMessage.TYPE).should.be.equal(1);
        });

        it("should throw Invalid subscription exception for null messageHandler", () => {
            pipeline.unregisterAll();

            // need to wrap errors in its own function
            var badMessageHandler = () => {
                pipeline.subscribe(null);
            }

            should.throw(badMessageHandler, 'Invalid subscription.');
        });

        it("should throw exception for invalid handler", () => {
            pipeline.unregisterAll();

            // need to wrap errors in its own function
            var badMessageHandler = () => {
                pipeline.subscribe({ messageFilter: "test", handler: null });
            }

            should.throw(badMessageHandler, 'messageHandler must be a function');
        });

        it("should throw exception for invalid message type", () => {
            pipeline.unregisterAll();

            // need to wrap errors in its own function
            var badMessageHandler = () => {
                pipeline.subscribe({ messageFilter: null, handler: null });
            }

            should.throw(badMessageHandler, 'Invalid messageType');
        });

        it.skip("should publish a subscription created message", () => {
        });
    });

    describe("subscribing to a message type by class type", () => {
        var pipeline = new Bus();

        it("should register subscriber for the message type", () => {
            pipeline.unregisterAll();
            pipeline.subscribe({ messageFilter: testData.TestMessage, handler: (message: any, context: MessageHandlerContext) => { } });
            pipeline.subscriberCount(testData.TestMessage).should.be.equal(1);
        });
    });

    describe("unsubscribing to a message type", () => {
        var pipeline = new Bus();

        pipeline.subscribe({ messageFilter: testData.TestMessage.TYPE, handler: (message: any) => { } });

        it("removes handler from subscription", () => {
            pipeline.subscriberCount(testData.TestMessage.TYPE).should.be.equal(1);
            // Add another subscriber
            let subscription = pipeline.subscribe({ messageFilter: testData.TestMessage.TYPE, handler: () => { } });
            pipeline.subscriberCount(testData.TestMessage.TYPE).should.be.equal(2);

            // Remove the last subscriber
            pipeline.unsubscribe(subscription);
            pipeline.subscriberCount(testData.TestMessage.TYPE).should.be.equal(1);
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

            counter.should.be.equal(3);
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

@iHandleMessages
export class TestMessageSubTypeHandlerWithInheritance {
    public value = 0;
    constructor(value: number) {
        this.value = value;
    }

    @handlerForSubType(testData.Exception)
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
            bus.subscriberCount(testData.TestMessage.TYPE).should.be.equal(1);
        });

        it("should call handler with correct class instance", async () => {
            bus.sendAsync(new testData.TestMessage(""));
            handlerClass.value.should.be.equal(110);
        });

        it("should still have a valid instance of for the class", () => {
            (handlerClass instanceof TestMessageHandler).should.be.true;
        })
    });

    describe("using the message type to define the messageFilter", () => {
        var bus = new Bus().makeGlobal();
        // Provide an instance for the handler to attach to
        let handlerClass = new TestMessageHandler2(50);

        it("should register subscriber for the message type", async () => {
            bus.subscriberCount("CustomerData2").should.be.equal(1);
        });

        it("should call handler with correct class instance", async () => {
            bus.sendAsync(new testData.CustomerData2(""));
            handlerClass.value.should.be.equal(150);
        });
    });

    describe("using the message type to define the messageFilter that uses inheritance", () => {
        var bus = new Bus().makeGlobal();
        // Provide an instance for the handler to attach to
        let handlerClass = new TestMessageHandlerWithInheritance(50);

        it("should register subscriber for the message type", async () => {
            bus.subscriberCount("Exception.MyException").should.be.equal(1);
        });

        it("should call handler with correct class instance", async () => {
            bus.sendAsync(new testData.MyException(""));
            handlerClass.value.should.be.equal(150);
        });
    });

    describe("using the message sub type to define the messageFilter that uses inheritance", () => {
        var bus = new Bus().makeGlobal();
        // Provide an instance for the handler to attach to
        let handlerClass = new TestMessageSubTypeHandlerWithInheritance(50);

        it("should register subscriber for the message type", async () => {
            bus.subscriberCount("Exception.*").should.be.equal(1);
        });

        it("should call handler with correct class instance", async () => {
            bus.publish(new testData.MyException(""));
            handlerClass.value.should.be.equal(150);
        });
    });

    describe("having multiple handlers using both methods", () => {
        var bus = new Bus().makeGlobal();
        // Provide an instance for the handler to attach to
        let handlerClass = new TestMessageHandler3(30);

        it("should register subscriber for the message type", async () => {
            bus.subscriberCount(testData.TestMessage.TYPE).should.be.equal(1);
            bus.subscriberCount("CustomerData2").should.be.equal(1);
        });

        it("should call handlers with correct class instance", async () => {
            bus.sendAsync(new testData.TestMessage(""));
            bus.sendAsync(new testData.CustomerData2(""));
            handlerClass.value.should.be.equal(230);
        });

        it("should remove handlers when calling dynamically defined unsubscribeHandlers", async () => {
            // Verify the subscriptions exist first
            bus.subscriberCount(testData.TestMessage.TYPE).should.be.equal(1);
            bus.subscriberCount(testData.CustomerData2).should.be.equal(1);
            // This method is added dynamically so typescript is not aware of it, so need to cast to any
            (handlerClass as any).unsubscribeHandlers();
            bus.subscriberCount(testData.TestMessage.TYPE).should.be.equal(0);
            bus.subscriberCount(testData.CustomerData2).should.be.equal(0);
        });
    });
});
