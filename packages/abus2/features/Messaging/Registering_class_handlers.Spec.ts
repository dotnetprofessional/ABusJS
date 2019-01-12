import { Bus } from "../../src/Bus";
import * as classHandlers from "../MessageTypes";
import { sleep } from "../Utils";

feature(`Registering class handlers
    Classes can define handlers via decorators which can then be auto subscribed to the bus.
    This can be done individually or as a group via an export of an index file.

    `, () => {
        let bus: Bus;

        background(``, () => {
            given(`abus is configured with the ExpressMemoryTransport`, () => {
                bus = new Bus;

                // configure bus
                bus.start();
                classHandlers.handlerResponse.value = 0;
            });
        });

        scenario(`Subscribe class handlers using a class type`, () => {
            given(`handlers have been defined in a class`, () => {
            });

            when(`passing the class type 'MyHandlerByTypeDefinition' to bus.registerHandlers`, async () => {
                bus.registerHandlers(classHandlers.MyHandlerByTypeDefinition);
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

            then(`the registered '6' ares subscribed`, () => {
                (bus as any).messageSubscriptions.length.should.be.equal(stepContext.values[0]);
            });
        });

        scenario(`Subscribe using instance of class with handlers`, () => {
            given(`handlers have been defined in a class`, () => {
            });

            when(`passing the class type 'MyHandlerByTypeDefinition' to bus.registerHandlers`, async () => {
                bus.registerHandlers(new classHandlers.MyHandlerByTypeDefinition());
            });

            then(`the registered '2' ares subscribed`, () => {
                (bus as any).messageSubscriptions.length.should.be.equal(stepContext.values[0]);
            });
        });

        scenario(`Handlers are bound to class instance when subscribing using a class instance`, () => {
            let instance: classHandlers.HandlersByClassInstance;

            given(`handlers have been defined in a class`, () => {
                instance = new classHandlers.HandlersByClassInstance();
            });
            and(`the value of count is 10`, () => {

            });

            when(`passing the class type 'HandlersByClassInstance' to bus.registerHandlers`, async () => {
                bus.registerHandlers(instance);
            });
            and(`sending the message 'PlusOne'`, () => {
                bus.sendAsync(new classHandlers.PlusOne(2))
            });
            then(`the count should be '11'`, async () => {
                // give the system time to process the messages
                await sleep(50);
                instance.count.should.be.eql(stepContext.values[0]);
            });
        });
    });
