import { Bus } from "../../src/Bus";
import { sleep } from "../Utils";
require("chai").should();

feature(`Publish a message to a subscriber`, () => {
    let bus: Bus
    const type = "UNIT_TEST";
    let messagesReceived = [];

    background(``, () => {
        given(`abus is configured with the ExpressMemoryTransport`, () => {
            bus = new Bus;

            // configure bus
            bus.start();
        });
        and(`two event handler are registered to receive the message`, () => {
            // configure handler
            bus.subscribe(type, async (message: any) => {
                messagesReceived.push(message);
            });

            bus.subscribe(type, async (message: any) => {
                messagesReceived.push(message);
            });
        });
    });

    scenario(`Publishing a message with no body is received by registered handler`, () => {
        when(`a message of type '${type}' is sent`, async () => {
            await bus.publishAsync({ type: `${stepContext.values[0]}` });
        });

        then(`the each of the '2' registered handlers receives the message in its own instance`, async () => {
            // give the system time to process the messages
            await sleep(50);
            messagesReceived.length.should.be.eql(stepContext.values[0]);
        });
    });

    scenario(`Registering for a published message using type*`, () => {
        let messageCount = 0;

        given(`a subscription with the filter 'Error.*'`, () => {
            bus.subscribe(stepContext.values[0], message => {
                messageCount++;
            });
        });

        when(`a message of type 'Error.Test1' and 'Error.Test2' and 'Error.Test3' is sent`, async () => {
            await bus.publishAsync({ type: `${stepContext.values[0]}` });
            await bus.publishAsync({ type: `${stepContext.values[1]}` });
            await bus.publishAsync({ type: `${stepContext.values[2]}` });
            await bus.publishAsync({ type: type });
        });

        then(`the each of the '3' messages is received by the handler`, async () => {
            // give the system time to process the messages
            await sleep(50);
            messageCount.should.be.eql(stepContext.values[0]);
        });
    });

    scenario(`Registering for a published message using *type`, () => {
        let messageCount = 0;

        given(`a subscription with the filter '*.Test2'`, () => {
            bus.subscribe(stepContext.values[0], message => {
                messageCount++;
            });
        });

        when(`a message of type 'Error.Test1' and 'Error.Test2' and 'Error.Test3' is sent`, async () => {
            await bus.publishAsync({ type: `${stepContext.values[0]}` });
            await bus.publishAsync({ type: `${stepContext.values[1]}` });
            await bus.publishAsync({ type: `${stepContext.values[2]}` });
        });

        then(`the each of the '1' messages is received by the handler`, async () => {
            // give the system time to process the messages
            await sleep(50);
            messageCount.should.be.eql(stepContext.values[0]);
        });
    });
});