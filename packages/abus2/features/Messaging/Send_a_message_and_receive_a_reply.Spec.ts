import { Bus } from "../../src/Bus";
import * as chai from "chai";
import { IMessageHandlerContext } from "../../src/IMessageHandlerContext";
import { sleep } from "../Utils";

const should = chai.should();

feature(`Send a message and receive a reply`, () => {
    let bus: Bus
    const type = "UNIT_TEST";

    background(``, () => {
        given(`abus is configured with the ExpressMemoryTransport`, () => {
            bus = new Bus();

            // configure bus
            bus.start();
        });

    });

    scenario(`Sending a message with a reply`, () => {
        let result: string;

        given(`an event handler is registered to receive the message type ${type}`, () => {
            // configure handler
            bus.subscribe(type, async (message: any, context: IMessageHandlerContext) => {
                context.replyAsync("response");
            });
        });

        and(`send a reply`, () => {
            // happens in the handler - see given
        });

        when(`sending a message with type '${type}'`, async () => {
            const p = await bus.sendWithReplyAsync({ type: type });
            result = await p.responseAsync<string>();
        });

        then(`a reply is received`, async () => {
            // give the system time to process the messages
            result.should.be.equal("response");
        });
    });

    scenario(`Sending a message with a reply which is cancelled before reply is received`, () => {
        let result: string;

        given(`an event handler is registered to receive the message type ${type}`, () => {
            // configure handler
            bus.subscribe(type, async (message: any, context: IMessageHandlerContext) => {
                await sleep(20); // Wait a long time before sending the reply
                context.replyAsync("response");
            });
        });

        and(`send a reply`, () => {
            // happens in the handler - see given
        });

        when(`sending a message with type '${type}'`, async () => {
            const p = await bus.sendWithReplyAsync({ type: type });
            p.cancel();
            result = await p.responseAsync<string>();
        });

        then(`a reply is received`, async () => {
            // give the system time to process the messages
            should.equal(undefined, result);
        });
    });

});
