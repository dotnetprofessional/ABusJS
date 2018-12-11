import { Bus } from "../../src/Bus";
import * as chai from "chai";
import { IMessageHandlerContext } from "../../src/IMessageHandlerContext";
import { MessageException } from "../../src/tasks/MessageException";

const should = chai.should();

feature(`Unsubscribing handlers`, () => {
    let bus: Bus
    const type = "UNIT_TEST";
    let messageReceived: string;

    background(``, () => {
        given(`abus is configured with the ExpressMemoryTransport`, () => {
            bus = new Bus;

            // configure bus
            bus.start();
        });
    });

    scenario(`Sending a message to an unsubscribed event handler`, () => {
        let subscriptionId: string;
        let exception: MessageException;

        given(`a handler has been registered for message type '${type}'`, () => {
            // configure handler
            subscriptionId = bus.subscribe(stepContext.values[0], (message: any, context: IMessageHandlerContext) => {
                messageReceived = context.activeMessage.type;
            });

            bus.subscribe(MessageException.type, (message: MessageException) => {
                exception = message;
            });
        });
        when(`unsubscribing the handler`, async () => {
            bus.unsubscribe(subscriptionId);
        });

        and(`sending message of type '${type}'`, async () => {
            await bus.sendAsync({ type: `${stepContext.values[0]}` });
        });

        then(`then the handler doesn't received the message`, () => {
            should.equal(undefined, messageReceived);
        });

        and(`an error is published 'No subscriber defined for the command UNIT_TEST'`, () => {
            exception.error.should.be.eq(stepContext.values[0]);
        });
    });

    scenario(`Publishing message to an unsubscribed event handler`, () => {
        let subscriptionId: string;
        let exception: MessageException;

        given(`a handler has been registered for message type '${type}'`, () => {
            // configure handler
            subscriptionId = bus.subscribe(stepContext.values[0], (message: any, context: IMessageHandlerContext) => {
                messageReceived = context.activeMessage.type;
            });

            bus.subscribe(MessageException.type, (message: MessageException) => {
                exception = message;
            });
        });
        when(`unsubscribing the handler`, async () => {
            bus.unsubscribe(subscriptionId);
        });

        and(`publishing a message of type '${type}'`, async () => {
            await bus.publishAsync({ type: `${stepContext.values[0]}` });
        });

        then(`then the handler doesn't received the message`, () => {
            should.equal(undefined, messageReceived);
        });

        and(`an error is not published`, () => {
            should.equal(undefined, exception);
        });
    });
});
