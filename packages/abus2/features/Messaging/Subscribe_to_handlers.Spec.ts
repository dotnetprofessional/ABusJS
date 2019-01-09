import { Bus } from "../../src/Bus";
require("chai").should();

feature(`Subscribing to handlers`, () => {
    let bus: Bus
    const type = "UNIT_TEST";

    background(``, () => {
        given(`abus is configured with the ExpressMemoryTransport`, () => {
            bus = new Bus;

            // configure bus
            bus.start();
        });
    });

    scenario(`Subscribe to a handler using bus.subscribe`, () => {

        when(`subscribing for type '${type}'`, async () => {
            bus.subscribe(stepContext.values[0], () => { });
        });

        then(`then the subscription count is '1'`, () => {
            // its a private collection 
            (bus as any).messageSubscriptions.length.should.be.equal(stepContext.values[0]);
        });
    });

    scenario(`Subscribe to a handler using bus.subscribe receives messages sent`, () => {
        let messageReceived: boolean;

        when(`subscribing for type '${type}'`, async () => {
            bus.subscribe(stepContext.values[0], () => {
                messageReceived = true;
            });
        });

        and(`sending a message of type '${type}'`, () => {
            bus.sendAsync({ type: stepContext.values[0] });

        });

        then(`the messag is received`, () => {
            messageReceived.should.be.true;
        });
    });
});
