import { Bus, MessageHandlerContext, handler, namespace, iHandleMessages } from '../App'
import { Utils } from "../App/Utils";


@namespace("SampleMessageOverride")
class SampleMessageForMangling {

}

@iHandleMessages("SampleMessageHandler")
class SampleMessageHandler {

    public messageNamespace: string = "not set";
    public messageNamespaceUsingString: string = "not set";

    @handler(SampleMessageForMangling)
    public handler(message: SampleMessageForMangling, context: MessageHandlerContext) {
        this.messageNamespace = (message as any).__namespace;
    }

    @handler("SampleMessageOverride")
    public handler2(message: SampleMessageForMangling, context: MessageHandlerContext) {
        this.messageNamespaceUsingString = (message as any).__namespace;
    }
}


describe("Feature: Support code mangling", () => {

    describe("Scenario: override default namespace with @namespace where code is to be mangled", () => {
        let bus: Bus;
        let handler: SampleMessageHandler;

        before(() => {
            bus = new Bus().makeGlobal();
            handler = new SampleMessageHandler();
        });

        it("Given: a message type has applied the @namesapce decorator using the parameter 'SampleMessageOverride'", () => {

        });

        it("when: a message of that type is sent", () => {
            // Using publish as there is more than one receiver of the message
            bus.publish(new SampleMessageForMangling());
        });

        it("then: the receive message namespace when registering using function type should be the same as defined by the @namespace decorator", async () => {
            await Utils.sleep(10);
            handler.messageNamespace.should.be.equal("SampleMessageOverride");
        });

        it("then: the receive message namespace when registering by type name (string) should be the same as defined by the @namespace decorator", async () => {
            await Utils.sleep(10);
            handler.messageNamespaceUsingString.should.be.equal("SampleMessageOverride");
        });
    });
});
