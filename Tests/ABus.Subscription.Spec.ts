import {Bus} from '../ABus'
import {MessageHandlerContext} from '../MessageHandlerContext'
import {IMessageHandlerContext} from '../IMessageHandlerContext'
import {MessageHandlerOptions, ThreadingOptions} from '../MessageHandlerOptions'

import * as testData from './ABus.Sample.Messages'

describe("subscribing to a message type", () => {
    var pipeline = new Bus();

    it("should register subscriber for the message type", () => {
        pipeline.unregisterAll();
        pipeline.subscribe({ messageFilter: testData.TestMessage.TYPE, handler: (message: any, bus: MessageHandlerContext) => { } });
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

    it.skip("handler no longer recieves messages", () => {
    });
});

describe("subscribing to a message sub type", () => {
    var pipeline = new Bus();

    it("should receive messages for all message types currently registered with supplied type prefix", () => {
        let counter = 0;
        pipeline.subscribe({
            messageFilter: "test.*", handler: (message: any, context: IMessageHandlerContext) => {
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
        debugger;
        pipeline.subscribe({
            messageFilter: "*.reply", handler: (message: any, context: IMessageHandlerContext) => {
                // DEBUG HERE!
                debugger;
                if (context.messageType === testData.TestMessage1Reply.TYPE) {
                    counter += 1;
                } else {
                    if (context.messageType === testData.TestMessage2Reply.TYPE) {
                        counter += 2;
                    }
                }

                if (context.messageType === testData.TestMessage2.TYPE) {
                    // Ensures this message wasn't recieved as it wasn't subscribed to
                    counter += 1;
                } 
            }
        });
        debugger;
        pipeline.publish({ type: testData.TestMessage1Reply.TYPE, message: {} });
        pipeline.publish({ type: testData.TestMessage2Reply.TYPE, message: {} });
        pipeline.publish({ type: testData.TestMessage2.TYPE, message: {} });

        expect(counter).toBe(3);
    });
});

describe("subscribing to a message with throttling", () => {
    var pipeline = new Bus();

    it.skip("should only forward messages once per throttle period ", () => {
        // Ie throttle 1 sec should only receive messages every 1 second even if more have arrived

    });

    it.skip("should receive messages for all message types currently registered with supplied type suffix", () => {
        //pipeline.subscribe("*.message1", (message: any) => { });
    });

});
