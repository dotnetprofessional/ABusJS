import { Bubbles } from "../../src";
import { IBubbleFlowResult } from "../../src/IBubbleFlowResult";
import { IMessageHandlerContext } from "abus";

feature(`Simply capture message flow

    Support the ability to allow a message flow to run without explicitly defining the message flow. This can be useful
    to capture the messages generated by sending a message. It can also be used for more ad-hoc validation of specific messages.
    `, () => {

        scenario(`Only defining the first message allows the full message flow to be captured`, () => {
            let bubbles: Bubbles;

            given(`a registered handler accepts the message 'request' and sends a message 'response`, () => {
                bubbles = new Bubbles();

                bubbles.bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    context.sendAsync({ type: "response", id: 1 });
                }, { identifier: "Spec" });

                bubbles.bus.subscribe("response", async (message: any, context: IMessageHandlerContext) => {
                    context.sendAsync({ type: "receiver-response", id: message.id });
                }, { identifier: "Spec" });

            });

            when(`sending the first request message

                As Bubbles has no way of knowing if a message flow had completed, its necessary to add a delay >= to
                the amount of time that would be expected for the flow to complete. This is done using the '-' which represents
                a 10ms delay.
                """
                (!request)-------

                request: {"type":"request"}
                """
                `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                });

            then(`the message flow matches
                An error is expected here as the last message sent has no handler defined.
                
                """
                sequenceDiagram

                participant Bubbles
                participant Spec
                Bubbles->>Spec:request
                Spec->>Spec:response
                Spec->>unhandled:receiver-response
                Bubbles->>unhandled:Bus.Error
                """
                `, () => {
                    const actual = bubbles.visualizations.toSequenceDiagram();
                    actual.should.be.eq(stepContext.docString);
                });
        });
    });