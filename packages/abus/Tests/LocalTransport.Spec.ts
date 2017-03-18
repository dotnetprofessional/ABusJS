import * as chai from "chai";

import { LocalTransport } from '../App/Transports/LocalTransport'
import { IMessage } from '../App/IMessage'
import * as testData from './ABus.Sample.Messages'

const should = chai.should();

describe("subscribing to a message type", () => {
    var transport = new LocalTransport();

    it("should register subscriber for the message type", () => {
        transport.unsubscribeAll();
        transport.subscribe("test", testData.TestMessage.TYPE);
        transport.subscriberCount(testData.TestMessage.TYPE).should.be.equal(1);
    });

    it("should throw Invalid subscription name exception for null name", () => {
        transport.unsubscribeAll();

        // need to wrap errors in its own function
        var badMessageHandler = () => {
            transport.subscribe(null, "*");
        }

        should.throw(badMessageHandler, 'Invalid subscription name.');
    });

    it("should throw exception for invalid message filter", () => {
        transport.unsubscribeAll();

        // need to wrap errors in its own function
        var badMessageHandler = () => {
            transport.subscribe("test", null);
        }

        should.throw(badMessageHandler, 'Invalid filter parameter.');
    });

    it("should throw exception when subscription name already exists", () => {
        transport.unsubscribeAll();
        transport.subscribe("test", "*");

        // need to wrap errors in its own function
        var badMessageHandler = () => {
            transport.subscribe("test", "*");
        }

        should.throw(badMessageHandler, 'Subscription with name test already exists.');
    });
});

describe("unsubscribing to a message type", () => {
    var transport = new LocalTransport();

    transport.subscribe("test", testData.TestMessage.TYPE);

    it("removes handler from subscription", () => {
        transport.subscriberCount(testData.TestMessage.TYPE).should.be.equal(1);
        // Add another subscriber
        transport.subscribe("test1", testData.TestMessage.TYPE);
        transport.subscriberCount(testData.TestMessage.TYPE).should.be.equal(2);

        // Remove the last subscriber
        transport.unsubscribe("test");
        transport.subscriberCount(testData.TestMessage.TYPE).should.be.equal(1);
    });
});

describe("subscribing to a message sub type", () => {
    var transport = new LocalTransport();

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

        counter.should.be.equal(3);
    });
});

describe("multiple subscribers to a message", () => {
    var transport = new LocalTransport();

    it("should receive messages for all message types currently registered with supplied type prefix", () => {
        let counter = 0;
        transport.subscribe("test1", "test.*");
        transport.subscribe("test2", testData.TestMessage.TYPE);
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
        // This message is only handled by one of the subscribers
        transport.send({ type: testData.TestMessage2.TYPE, message: {} });

        counter.should.be.equal(4);
    });
});

