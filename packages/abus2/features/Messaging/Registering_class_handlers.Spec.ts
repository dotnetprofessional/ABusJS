import { Bus } from "../../src/Bus";
import { MyHandlerByTypeDefinition, handlerResponse } from "../MessageTypes";
import * as classHandlers from "../MessageTypes";

feature(`Registering class handlers
    Classes can define handlers via decorators which can then be auto subscribed to the bus.
    This can be done individually or as a group via an export of an index file.

    `, () => {
        let bus: Bus

        background(``, () => {
            given(`abus is configured with the ExpressMemoryTransport`, () => {
                bus = new Bus;

                // configure bus
                bus.start();
                handlerResponse.value = 0;
            });
        });

        scenario(`Subscribe class handlers using a class type`, () => {
            given(`handlers have been defined in a class`, () => {
            });

            when(`passing the class type 'MyHandlerByTypeDefinition' to bus.registerHandlers`, async () => {
                bus.registerHandlers(MyHandlerByTypeDefinition);
            });

            then(`the registered '2' ares subscribed`, () => {
                (bus as any).messageSubscriptions.length.should.be.equal(stepContext.values[0]);
            });
        });

        scenario(`Subscribe multiple class handlers using an exported object type`, () => {
            given(`multiple class handlers exist in an index file`, () => {
            });

            when(`passing the class type 'MyHandlerByTypeDefinition' to bus.registerHandlers`, async () => {
                bus.registerHandlers(classHandlers);
            });

            then(`the registered '4' ares subscribed`, () => {
                (bus as any).messageSubscriptions.length.should.be.equal(stepContext.values[0]);
            });
        });
    });
