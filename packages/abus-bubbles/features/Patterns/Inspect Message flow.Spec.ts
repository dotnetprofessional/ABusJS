import { Bubbles } from "../../src";
import { IMessageHandlerContext } from 'abus2';

feature(`Inspect Message flow`, () => {
    scenario(`Inspect an observed message of a particular type`, () => {
        let bubbles: Bubbles;

        given(`a message flow contained the message type 'request'`, () => {
            bubbles = new Bubbles();

            bubbles.bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                context.sendAsync({ type: "response", id: 1 });
            }, { identifier: "Spec" });

            bubbles.bus.subscribe("response", async (message: any, context: IMessageHandlerContext) => {
                context.sendAsync({ type: "receiver-response", id: message.id });
            }, { identifier: "Spec" });

        });

        when(`executing the message flow
            """
            (!request)---

            request: { "type": "request" }
            """
            `, async () => {
                await bubbles.executeAsync(stepContext.docString);
            });

        then(`the observed messages is able to be inspected using the 'observedMessageOfType' method`, () => {
            const message = bubbles.observedMessageOfType("response");
            (message as any).id.should.be.eq(1)
        });
    });
});