import {
    MessagePipeline,
    MessageHandlerContext,
    IMessageHandlerContext,
    ThreadingOptions,
    MessageHandlerOptions
} from '../ABus';

var syncHandlerOptions = new MessageHandlerOptions();
syncHandlerOptions.threading = ThreadingOptions.Sync;

describe("subscribing to a message type", () => {
    var pipeline = new MessagePipeline();

    var messageType = "test.message";

    it("should register subscriber for the message type", () => {
        pipeline.unregisterAll();
        pipeline.subscribe({ messageType: messageType, handler: (message: any, bus: MessageHandlerContext) => { } });
        expect(pipeline.subscriberCount(messageType)).toBe(1);
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
            pipeline.subscribe({ messageType: "test", handler: null });
        }

        expect(badMessageHandler).toThrowError('messageHandler must be a function');
    });

    it("should throw exception for invalid message type", () => {
        pipeline.unregisterAll();

        // need to wrap errors in its own function
        var badMessageHandler = () => {
            pipeline.subscribe({ messageType: null, handler: null });
        }

        expect(badMessageHandler).toThrowError('Invalid messageType');
    });

    it("* should publish a subscription created message", () => {
    });
});

describe("unsubscribing to a message type", () => {
    var pipeline = new MessagePipeline();

    var messageType = "test.message";
    pipeline.subscribe({ messageType: messageType, handler: (message: any) => { } });

    it("removes handler from subscription", () => {
        expect(pipeline.subscriberCount(messageType)).toBe(1);
        // Add another subscriber
        let subscription = pipeline.subscribe({ messageType: messageType, handler: IMessag => { } });
        expect(pipeline.subscriberCount(messageType)).toBe(2);

        // Remove the last subscriber 
        pipeline.unsubscribe(subscription);
        expect(pipeline.subscriberCount(messageType)).toBe(1);
    });

    it("*   handler no longer recieves messages", () => {
    });
});

describe("subscribing to a message sub type", () => {
    var pipeline = new MessagePipeline();

    var testMessage1 = "test.message1";
    var testMessage2 = "test.message2";
    var counter = 0;

    it("should receive messages for all message types currently registered with supplied type prefix", () => {
        counter = 0;
        pipeline.subscribe({
            messageType: "test.*", handler: (message: any, context: IMessageHandlerContext) => {
                if (context.messageType === testMessage1) {
                    counter += 1;
                } else {
                    if (context.messageType === testMessage2) {
                        counter += 2;
                    }
                }
            }
        }, syncHandlerOptions);

        pipeline.publish({ type: testMessage1, message: {} });
        pipeline.publish({ type: testMessage2, message: {} });

        expect(counter).toBe(3);
    });

    it("* should receive messages for all message types currently registered with supplied type suffix", () => {
        //pipeline.subscribe("*.message1", (message: any) => { });
    });
});

describe("subscribing to a message with throttling", () => {
    var pipeline = new MessagePipeline();

    it("* should only forward messages once per throttle period ", () => {
        // Ie throttle 1 sec should only receive messages every 1 second even if more have arrived

    });

    it("* should receive messages for all message types currently registered with supplied type suffix", () => {
        //pipeline.subscribe("*.message1", (message: any) => { });
    });

});
