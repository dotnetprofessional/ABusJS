import { Bus } from "../../src/Bus";
import { MessageException } from "../../src/tasks/MessageException";
import { waitUntilAsync } from "../Utils";

feature(`Exceptions are published`, () => {
    let bus: Bus;
    const type = "UNIT_TEST";

    background(``, () => {
        given(`abus is configured with the ExpressMemoryTransport`, () => {
            bus = new Bus;

            // configure bus
            bus.start();
        });
    });

    scenario(`Errors within handlers publish the error`, () => {
        let exceptionMessage: MessageException;

        given(`a handler for type '${type}' and it throws an error`, () => {
            // configure handler
            bus.subscribe(type, async (message: any) => {
                throw new Error("Blowed Up!");
            });

            bus.subscribe(MessageException.type, async (message: MessageException) => {
                exceptionMessage = message;
            });
        });

        when(`a message of type '${type}' is sent`, async () => {
            await bus.sendAsync({ type: `${stepContext.values[0]}` });
        });

        then(`an exception with the message 'Blowed Up!' is published`, async () => {
            // give the system time to process the messages
            await waitUntilAsync(() => exceptionMessage, 200);
            exceptionMessage.message.should.be.equal(stepContext.values[0]);
        });
    });
});
