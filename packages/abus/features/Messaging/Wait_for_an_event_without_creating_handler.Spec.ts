import { Bus } from "../../src/Bus";
import * as chai from "chai";
import { IMessageHandlerContext } from "../../src/IMessageHandlerContext";
import { sleep } from "../Utils";
import { TimeSpan } from '../../src';
import { TimeoutException } from '../../src/Exceptions';

feature(`Wait for an event without creating a handler`, () => {
    let bus: Bus
    const type = "UNIT_TEST";

    background(``, () => {
        given(`abus is configured with the ExpressMemoryTransport`, () => {
            bus = new Bus();

            // configure bus
            bus.start();
        });

    });

    scenario(`Sending a command and waiting for the published event`, () => {
        let result: string;

        given(`an event handler is registered to receive the message type ${type}`, () => {
            // configure handler
            bus.subscribe(type, async (message: any, context: IMessageHandlerContext) => {
                // a small delay 
                await sleep(10);
                await context.publishAsync({ type: "response", payload: "response" });
            });
        });

        and(`the handler publishes a response`, () => {
            // happens in the handler - see given
        });

        when(`sending a message with type '${type}'`, async () => {
            await bus.sendAsync<string>({ type: type }, { timeout: TimeSpan.FromMilliseconds(100) });
            result = await bus.waitForEventAsync("response");
        });

        then(`the published event is received`, async () => {
            // give the system time to process the messages
            result.should.be.equal("response");
        });
    });

    scenario(`Sending a command within a handler and waiting for the published event`, () => {
        let result: string;

        given(`an event handler is registered to receive the message type ${type}`, () => {
            // configure handler
            bus.subscribe(type + "publish", async (message: any, context: IMessageHandlerContext) => {
                // a small delay 
                await sleep(10);
                await context.publishAsync({ type: "response", payload: "response" });
            });

            bus.subscribe(type, async (message: any, context: IMessageHandlerContext) => {
                await context.sendAsync<string>({ type: type + "publish" }, { timeout: TimeSpan.FromMilliseconds(100) });
                result = await context.waitForEventAsync("response");
            }, { identifier: "Unit Test" });
        });

        and(`the handler publishes a response`, () => {
            // happens in the handler - see given
        });

        when(`sending a message with type '${type}'`, async () => {
            await bus.sendAsync<string>({ type: type }, { timeout: TimeSpan.FromMilliseconds(100) });
        });

        then(`the published event is received`, async () => {
            // a small delay 
            await sleep(100);
            // give the system time to process the messages
            result.should.be.equal("response");
        });
    });

});
