import { Bus } from "../../src/Bus";
import { IMessageHandlerContext } from "../../src/IMessageHandlerContext";
import * as chai from "chai";
import { waitUntilAsync } from "../Utils";
chai.should();

feature(`Sending a message using MessageContext`, () => {
    let bus: Bus
    let secondMessageReceived: boolean = false;

    background(``, () => {
        given(`abus is configured with the ExpressMemoryTransport`, () => {
            bus = new Bus();

            // configure bus
            bus.start();
            secondMessageReceived = false;
        });
    });

    scenario(`Sending a message from a handler using MessageContext`, () => {
        given(`a handler receives messages for message type 'UNIT_TEST'`, () => {
            // configure handler
            bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                context.sendAsync({ type: "UNIT_TEST_SEND" });
            });
        });

        and(`a handler receives messages for message type 'UNIT_TEST_SEND'`, () => {
            // configure handler
            bus.subscribe(stepContext.values[0], async (message: any) => {
                secondMessageReceived = true;
            });
        });

        when(`a message of type 'UNIT_TEST' is received by the first handler`, async () => {
            await bus.sendAsync({ type: `${stepContext.values[0]}` });
        });

        and(`a message of type 'UNIT_TEST_SEND' sent by the handler
        `, () => {

            });

        then(`the message sent from the first handler is received by the second`, async () => {
            // give the system time to process the messages
            await waitUntilAsync(() => secondMessageReceived, 200);
            secondMessageReceived.should.be.true;
        });
    });

    scenario(`Publishing a message from a handler using MessageContext`, () => {
        given(`a handler receives messages for message type 'UNIT_TEST'`, () => {
            // configure handler
            bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                context.publishAsync({ type: "UNIT_TEST_PUBLISH" });
            });
        });

        and(`a handler receives messages for message type 'UNIT_TEST_PUBLISH'`, () => {
            // configure handler
            bus.subscribe(stepContext.values[0], async (message: any) => {
                secondMessageReceived = true;
            });
        });

        when(`a message of type 'UNIT_TEST' is received by the first handler`, async () => {
            await bus.sendAsync({ type: `${stepContext.values[0]}` });
        });

        and(`a message of type 'UNIT_TEST_SEND' sent by the handler
        `, () => {

            });

        then(`the message sent from the first handler is received by the second`, async () => {
            // give the system time to process the messages
            await waitUntilAsync(() => secondMessageReceived, 200);
            secondMessageReceived.should.be.true;
        });
    });
});
