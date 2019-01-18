import { identifier } from "../../src/decorators/identifier";
import { handler, MessageHandlerContext, Bus } from "../../src";
import { sleep } from "../Utils";

@identifier("SampleMessageOverride")
class SampleMessageForMangling {

}

@identifier("SampleMessageHandler")
class SampleMessageHandler {

    public messageidentifier: string = "not set";
    public messageidentifierUsingString: string = "not set";

    @handler(SampleMessageForMangling)
    public handler(message: SampleMessageForMangling, context: MessageHandlerContext) {
        this.messageidentifier = (message as any).__identifier;
    }

    @handler("SampleMessageOverride")
    public handler2(message: SampleMessageForMangling, context: MessageHandlerContext) {
        this.messageidentifierUsingString = (message as any).__identifier;
    }
}


feature("Override type identifier", () => {

    scenario(`Override default auto identifier with @identifier
    
        There maybe times when overriding the auto-generated identifier for a class being used as a message type,
        process or saga maybe necessary. One area where this is critical is when the outputted code will be managled
        by a library such as uglifgyJS, which will break auto-generated identifiers.
        `, () => {
            let bus: Bus;
            let handler: SampleMessageHandler;

            before(() => {
                bus = new Bus();
                bus.start();
                handler = new SampleMessageHandler();
                bus.registerHandlers(handler);
            });

            given("a message type has applied the @identifier decorator using the parameter 'SampleMessageOverride'", () => {

            });

            when("a message of that type is sent", () => {
                // using publish as there is more than one receiver of the message
                debugger;
                bus.publishAsync(new SampleMessageForMangling());
            });

            then("the received message has the identifier 'SampleMessageOverride' when registering by class type", async () => {
                await sleep(10);
                handler.messageidentifier.should.be.equal(stepContext.values[0]);
            });

            and("the received message has the identifier 'SampleMessageOverride' when registering by string identifier", async () => {
                await sleep(10);
                handler.messageidentifierUsingString.should.be.equal("SampleMessageOverride");
            });
        });
});
