import {Bus} from '../ABus'
import {MessageHandlerContext} from '../MessageHandlerContext'
import {IMessage} from '../IMessage'
import {IMessageSubscription} from '../IMessageSubscription'
import {IMessageHandlerContext} from '../IMessageHandlerContext'
import {MessageHandlerOptions, ThreadingOptions} from '../MessageHandlerOptions'
import {Utils} from '../Utils'

import * as testData from './ABus.Sample.Messages'

describe.skip("publishing a message outside of a handler", () => {
    var pipeline = new Bus();
    var currentHandlerContext: MessageHandlerContext;

    pipeline.config.useConventions = false;
    pipeline.subscribe({
        messageFilter: testData.TestMessage.TYPE,
        handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
            currentHandlerContext = context;
        }
    });

    it("should add a messageHandlerContext to the handler recieving message being sent", () => {
        pipeline.send(new testData.TestMessage("Johhny Smith"));
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

    it("should add replyTo to messageHandlerContext", () => {
        expect(currentHandlerContext.getMetaDataValue("replyTo")).toBeDefined();
    });

    it("should verify there is only one subscriber for message type", () => {
        // Subscribe twice for the same message. When attempting to use Send this should fail
        pipeline.subscribe({
            messageFilter: testData.TestMessage.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
            }
        });

        pipeline.subscribe({
            messageFilter: testData.TestMessage.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
            }
        });

        // need to wrap errors in its own function
        var badMessageHandler = () => {
            pipeline.send({ type: testData.TestMessage.TYPE, message: new testData.TestMessage("") });
        }

        expect(badMessageHandler).toThrowError('The command test.message must have only one subscriber.');

    });

    it("should throw SubscriberNotFound exception if no subscriber has registerd for message type", () => {
        // need to wrap errors in its own function
        var badMessageHandler = () => {
            pipeline.send({ type: testData.TestMessage2.TYPE, message: new testData.TestMessage("") });
        }

        expect(badMessageHandler).toThrowError('No subscriber defined for the command test.message2');
    });

    it("should send to registered subscriber", () => {
        let recievedEvent = false;
        pipeline.unregisterAll();
        pipeline.subscribe({
            messageFilter: testData.TestMessage.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                recievedEvent = true;
            }
        });

        pipeline.send({ type: testData.TestMessage.TYPE, message: new testData.TestMessage("hhh") });
        return Utils.sleep(50)
            .then(() => {
                expect(recievedEvent).toBe(true);
            })
            .catch(() => {
                throw new TypeError("no error should have been caught");
            });
    });

    it("should invoke reply handler after executing message handler", ()=> {
        let recievedEvent = false;
        pipeline.unregisterAll();

        pipeline.subscribe({
            messageFilter: testData.TestMessage.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                recievedEvent = true;
                context.reply("Hello World!");
            }
        });

        return pipeline.send({ type: testData.TestMessage.TYPE, message: new testData.TestMessage("hhh") })
            .then((message: string) => {
                expect(message).toBe("Hello World!");
            });
    });
});
