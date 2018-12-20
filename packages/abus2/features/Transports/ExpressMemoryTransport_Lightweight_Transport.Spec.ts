import "livedoc-mocha";
import { ExpressMemoryTransport } from "../../src/Transports/ExpressMemoryTransport";
import { IMessage } from "../../src/IMessage";
import { TimeSpan } from "../../src/Timespan";
import { sleep } from "../Utils";

require('chai').should();

feature(`ExpressMemoryTransport: Minimalist in memory transport`, () => {
    scenario(`Sending a message is received by registered handler`, () => {
        const transport = new ExpressMemoryTransport();
        let handler: (message: IMessage<any>) => void;
        let messageWasReceived = false;

        given(`a handler has been defined to receive messages of type 'UNIT_TEST'`, () => {
            handler = (message: IMessage<any>) => {
                messageWasReceived = true;
            };

            transport.onMessage(handler);
        });

        when(`a message of type 'UNIT_TEST' is sent`, () => {
            transport.sendAsync({ type: `${stepContext.values[0]}` });
        });

        then(`the registered handler receives the message`, () => {
            messageWasReceived.should.be.true;
        });
    });

    scenario(`Publishing a message is received by registered handler`, () => {
        const transport = new ExpressMemoryTransport();
        let handler: (message: IMessage<any>) => void;
        let messageWasReceived = false;

        given(`a handler has been defined to receive messages of type 'UNIT_TEST'`, () => {
            handler = (message: IMessage<any>) => {
                messageWasReceived = true;
            };

            transport.onMessage(handler);
        });

        when(`a message of type 'UNIT_TEST' is published`, () => {
            transport.sendAsync({ type: `${stepContext.values[0]}` });
        });

        then(`the registered handler receives the message`, () => {
            messageWasReceived.should.be.true;
        });
    });

    scenario(`Sending a message with a delay is received by registered handler after delay`, () => {
        const transport = new ExpressMemoryTransport();
        let handler: (message: IMessage<any>) => void;
        let messageWasReceived = false;
        let startTime: number;
        let endTime: number;

        given(`a handler has been defined to receive messages of type 'UNIT_TEST'`, () => {
            handler = (message: IMessage<any>) => {
                messageWasReceived = true;
                endTime = Date.now();
            };

            transport.onMessage(handler);
        });

        when(`a message of type 'UNIT_TEST' is sent with a delay of '10'ms`, async () => {
            startTime = Date.now();
            const delay = stepContext.values[1];
            transport.sendAsync({ type: `${stepContext.values[0]}` }, TimeSpan.FromMilliseconds(delay));
            // Give the transport time deliver the message based on the delay
            await sleep(delay);
        });

        then(`the registered handler receives the message after delay`, () => {
            messageWasReceived.should.be.true;
            (endTime - startTime).should.be.greaterThan(9);
        });
    });
});