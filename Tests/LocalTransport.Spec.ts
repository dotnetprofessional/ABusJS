import { LocalTransport } from '../LocalTransport'
import { IMessage } from '../IMessage'
import * as testData from './Abus.Sample.Messages'

describe("subscribing to a message type", () => {
    var transport = new LocalTransport();

    it("should register subscriber for the message type", () => {
        transport.unsubscribeAll();
        transport.subscribe("test", testData.TestMessage.TYPE);
        expect(transport.subscriberCount(testData.TestMessage.TYPE)).toBe(1);
    });

    it("should throw Invalid subscription name exception for null name", () => {
        transport.unsubscribeAll();

        // need to wrap errors in its own function
        var badMessageHandler = () => {
            transport.subscribe(null, "*");
        }

        expect(badMessageHandler).toThrowError('Invalid subscription name.');
    });

    it("should throw exception for invalid message filter", () => {
        transport.unsubscribeAll();

        // need to wrap errors in its own function
        var badMessageHandler = () => {
            transport.subscribe("test", null);
        }

        expect(badMessageHandler).toThrowError('Invalid filter parameter.');
    });

    it("should throw exception when subscription name already exists", () => {
        transport.unsubscribeAll();
        transport.subscribe("test", "*");

        // need to wrap errors in its own function
        var badMessageHandler = () => {
            transport.subscribe("test", "*");
        }

        expect(badMessageHandler).toThrowError('Subscription with name test already exists.');
    });
});

describe("unsubscribing to a message type", () => {
    var transport = new LocalTransport();

    transport.subscribe("test", testData.TestMessage.TYPE);

    it("removes handler from subscription", () => {
        expect(transport.subscriberCount(testData.TestMessage.TYPE)).toBe(1);
        // Add another subscriber
        let subscription = transport.subscribe("test1", testData.TestMessage.TYPE);
        expect(transport.subscriberCount(testData.TestMessage.TYPE)).toBe(2);

        // Remove the last subscriber 
        transport.unsubscribe("test");
        expect(transport.subscriberCount(testData.TestMessage.TYPE)).toBe(1);
    });

    it.skip("handler no longer recieves messages", () => {
    });
});

describe("subscribing to a message sub type", () => {
    var transport = new LocalTransport();
    let counter = 0;

    it("should receive messages for all message types currently registered with supplied type prefix", () => {
        let counter = 0;
        transport.subscribe("test", "test.*")
        transport.onMessage((message: IMessage<any>) => {
            if (message.type === testData.TestMessage.TYPE) {
                counter += 1;
            } else {
                if (message.type === testData.TestMessage2.TYPE) {
                    counter += 2;
                }
            }
        });

        transport.send({ type: testData.TestMessage.TYPE, message: {} });
        transport.send({ type: testData.TestMessage2.TYPE, message: {} });

        expect(counter).toBe(3);
    });

    it("should receive messages for all message types currently registered with supplied type suffix", () => {
        let counter = 0;
        transport.unsubscribeAll();
        transport.subscribe("test_reply", "*.reply")
        transport.onMessage((message: IMessage<any>) => {
            if (message.type === testData.TestMessage1Reply.TYPE) {
                counter += 1;
            } else {
                if (message.type === testData.TestMessage2Reply.TYPE) {
                    counter += 2;
                }
            }

            if (message.type === testData.TestMessage2.TYPE) {
                // Ensures this message wasn't recieved as it wasn't subscribed to
                counter += 1;
            }
        });

        transport.send({ type: testData.TestMessage1Reply.TYPE, message: {} });
        transport.send({ type: testData.TestMessage2Reply.TYPE, message: {} });
        transport.send({ type: testData.TestMessage2.TYPE, message: {} });

        expect(counter).toBe(3);
    });
});

describe.skip("Sending an recieving messages", () => {
    var transport = new LocalTransport();
    let counter = 0;

    it("should be fast!", () => {
        let counter = 0;
        transport.subscribe("test", "test.*")
        let timerStart = new Date().getTime();
        let timerEnd = 0;
        transport.onMessage((message: IMessage<any>) => {
            counter++;
            if(counter === 1000) {
                timerEnd = new Date().getTime();
            }
        });

        for(let i=0;i<1000;i++) {
            transport.send({ type: testData.TestMessage.TYPE, message: {} });
        }

        let elapsed = timerEnd - timerStart;
        expect(counter).toBe(1000);
        expect(elapsed).toBeLessThan(100);
    });

});

