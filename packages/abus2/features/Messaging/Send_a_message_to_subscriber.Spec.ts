import { Bus } from "../../src/Bus";
import { IMessageHandlerContext } from "../../src/IMessageHandlerContext";
import { IMessage } from "../../src/IMessage";

feature(`Send a message to a subscriber`, () => {
    let bus: Bus
    const type = "UNIT_TEST";
    let messageReceived: IMessage<any>;

    background(``, () => {
        given(`abus is configured with the ExpressMemoryTransport`, () => {
            messageReceived = null;
            bus = new Bus;

            // configure bus
            bus.start();

            // configure handler
            bus.subscribe(type, (message: any, context: IMessageHandlerContext) => {
                messageReceived = context.activeMessage;
            });
        });
    });

    scenario(`Sending a message with no body is received by registered handler`, () => {
        when(`a message of type '${type}' is sent`, async () => {
            await bus.sendAsync({ type: `${stepContext.values[0]}` });
        });

        then(`the registered handler receives the message`, () => {
            messageReceived.type.should.be.equal(type);
        });
    });

    scenario(`Sending a message with a body is received by registered handler`, () => {
        const payload = "test message";

        when(`a message of type '${type}' is sent with a payload of '${payload}'`, async () => {
            await bus.sendAsync({ type: `${stepContext.values[0]}`, payload: stepContext.values[1] });
        });

        then(`the registered handler receives the message`, () => {
            messageReceived.type.should.be.equal(type);
            messageReceived.payload.should.be.equal(payload);
        });
    });
});
