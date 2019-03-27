import { Bus } from "../../src/Bus";
import * as chai from "chai";
import { IMessageHandlerContext } from "../../src/IMessageHandlerContext";
import { sleep } from "../Utils";
import { TimeSpan } from '../../src';
import { TimeoutException } from '../../src/Exceptions';

feature(`Send message with reply using a timeout`, () => {
    let bus: Bus
    const type = "UNIT_TEST";

    background(``, () => {
        given(`abus is configured with the ExpressMemoryTransport`, () => {
            bus = new Bus();

            // configure bus
            bus.start();
        });

    });

    scenario(`Sending a message with a reply that executes within timeout`, () => {
        let result: string;

        given(`an event handler is registered to receive the message type ${type}`, () => {
            // configure handler
            bus.subscribe(type, async (message: any, context: IMessageHandlerContext) => {
                // a small delay 
                await sleep(10);
                context.replyAsync("response");
            });
        });

        and(`send a reply`, () => {
            // happens in the handler - see given
        });

        when(`sending a message with type '${type}'`, async () => {
            const p = await bus.sendWithReplyAsync<string>({ type: type }, { timeout: TimeSpan.FromMilliseconds(100) });
            result = await p;
        });

        then(`a reply is received`, async () => {
            // give the system time to process the messages
            result.should.be.equal("response");
        });
    });

    scenario(`Sending a message with a reply that exceeds the timeout`, () => {
        let exception: TimeoutException;

        given(`an event handler is registered to receive the message type ${type}`, () => {
            // configure handler
            bus.subscribe(type, async (message: any, context: IMessageHandlerContext) => {
                // a small delay 
                await sleep(10);
                context.replyAsync("response");
            });
        });

        and(`send a reply`, () => {
            // happens in the handler - see given
        });

        when(`sending a message with type '${type}'`, async () => {
            try {
                const result = await bus.sendWithReplyAsync<string>({ type: type }, { timeout: TimeSpan.FromMilliseconds(5) });
            } catch (e) {
                exception = e;
            }
        });

        then(`a timeout error 'TimeoutException' is received`, async () => {
            // give the system time to process the messages
            exception.name.should.be.equal(stepContext.values[0]);
        });
    });
});
