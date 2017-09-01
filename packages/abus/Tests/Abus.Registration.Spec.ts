import { Bus } from "../app/Bus";
import { MessageHandlerContext } from "../app/MessageHandlerContext";
import { iHandleMessages } from "../app/Decorators/iHandleMessages";
import { handler } from "../app/Decorators/handler";

class SampleRequest {

}

let instanceCreated = false;
@iHandleMessages()
class SampleHandler {

    constructor() {
        instanceCreated = true;
    }
    @handler(SampleRequest)
    handler(message: SampleRequest, context: MessageHandlerContext) {

    }
}

class SampleHandler2 extends SampleHandler {

}

describe("Registering handlers", () => {

    describe("When registering a handler class", () => {
        let bus: Bus;
        before(() => {
            bus = new Bus().makeGlobal();
            bus.registerHandler(SampleHandler);
        });

        describe("When registering a handler", () => {

            it("should create an instance of the handler", () => {
                instanceCreated.should.be.equal(true);
            });

            it("should register handlers with the bus", () => {
                bus.subscriberCount(SampleRequest).should.be.equal(1);
            });
        });

        describe("When unregistering a specific handler class", () => {
            let bus: Bus;
            beforeEach(() => {
                bus = new Bus().makeGlobal();
                bus.registerHandler(SampleHandler);

                bus.unregisterHandler(SampleHandler);
            });

            it("should remove the handler instance", () => {
                // Shouldn't error out as the handler was removed
                bus.registerHandler(SampleHandler);
            });

            it("unregister subscriptions for handler class", () => {
                bus.subscriberCount(SampleRequest).should.be.equal(0);
            });
        });

        describe("When unregistering all handler classes", () => {
            let bus: Bus;
            beforeEach(() => {
                bus = new Bus().makeGlobal();
                bus.registerHandler(SampleHandler);
                bus.registerHandler(SampleHandler2);

                bus.unregisterAllHandlers();
            });

            it("should remove the handler instance", () => {
                // Shouldn't error out as the handler was removed
                bus.registerHandler(SampleHandler);
                bus.registerHandler(SampleHandler2);
            });

            it("unregister subscriptions for handler class", () => {
                bus.subscriberCount(SampleRequest).should.be.equal(0);
            });
        });
    });
});
