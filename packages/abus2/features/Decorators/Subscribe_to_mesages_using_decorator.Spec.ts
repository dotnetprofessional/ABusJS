import { Bus } from "../../src/Bus";
import { MyHandlerByTypeName, MyHandlerByTypeDefinition, PlusTwo, PlusOne, handlerResponse } from "../MessageTypes";

feature(`Subscribe to messages using decorators`, () => {
    let bus: Bus

    background(``, () => {
        given(`abus is configured with the ExpressMemoryTransport`, () => {
            bus = new Bus;

            // configure bus
            bus.start();
            handlerResponse.value = 0;
        });
    });

    scenario(`Subscribing to multiple messages using @handler by type name`, () => {
        given(`the MyHandler class handlers have been registered`, () => {
            bus.registerHandlers(MyHandlerByTypeName);
        });

        when(`a message of type 'plusOne' is sent with a payload of '1'`, async () => {
            await bus.sendAsync({ type: `${stepContext.values[0]}`, payload: stepContext.values[1] });
        });

        and(`a message of type 'plusTwo' is sent with a payload of '2'`, async () => {
            await bus.sendAsync({ type: `${stepContext.values[0]}`, payload: stepContext.values[1] });
        });

        then(`the registered handlers receives the messages`, () => {
            handlerResponse.value.should.be.eql(3);
        });
    });

    scenario(`Subscribing to multiple messages using @handler by type definition`, () => {
        given(`the MyHandler class handlers have been registered`, () => {
            bus.registerHandlers(MyHandlerByTypeDefinition);
        });

        when(`a message of type 'PlusOne' is sent with a payload of '5'`, async () => {
            await bus.sendAsync(new PlusOne(stepContext.values[1]));
        });

        and(`a message of type 'PlusTwo' is sent with a payload of '6'`, async () => {
            await bus.sendAsync(new PlusTwo(stepContext.values[1]));
        });

        then(`the registered handlers receives the messages`, () => {
            handlerResponse.value.should.be.eql(11);
        });
    });
});
