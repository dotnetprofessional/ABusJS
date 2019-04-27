import * as classHandlers from "../MessageTypes";
import { Bus } from "../../src";

feature(`Unregistering class handlers`, () => {
    let bus: Bus;
    scenario(`Unregister previously registered handlers from a class instance`, () => {
        let instance: classHandlers.HandlersByClassInstance;

        given(`a class instance has had its handlers registered`, () => {
            bus = new Bus();
            bus.start();

            instance = new classHandlers.HandlersByClassInstance();
            bus.registerHandlers(instance);
        });

        and(`there are '2' registered handlers`, () => {
            (bus as any).messageSubscriptions.length.should.be.eq(stepContext.values[0]);
        });

        when(`un-registering all handlers of the class instance`, () => {
            bus.unregisterHandlers(instance);
        });

        then(`there are '0' registered handlers `, () => {
            (bus as any).messageSubscriptions.length.should.be.eq(stepContext.values[0]);
        });

    });
});