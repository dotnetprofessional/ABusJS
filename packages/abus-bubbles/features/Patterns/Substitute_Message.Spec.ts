import "livedoc-mocha";
import { Bubbles } from '../../src';
import { IBubbleFlowResult } from '../../src/IBubbleFlowResult';
import { IMessageHandlerContext } from 'abus2';
import { validateMessageTypes } from './utils';

require("chai").should();

feature(`Substitute Message
    @link:../Bubbles.md#substitute

    Provides the ability to substitute a message before its consumed by the handler.
    `, () => {

        scenario(`Send multiple messages to handler`, () => {
            let bubbles: Bubbles;
            let bubblesResult: IBubbleFlowResult[];

            given(`a registered handler accepts the message 'request' and sends a message 'response`, () => {
                bubbles = new Bubbles();

                bubbles.bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    context.sendAsync({ type: "response", id: 1 });
                });

                bubbles.bus.subscribe("response", async (message: any, context: IMessageHandlerContext) => {
                    context.sendAsync({ type: "receiver-response", id: message.id });
                });

            });

            when(`sending the message 'api-request'
                This flow will substitute the response which would be id: 1 normally with id: 100. It should be
                noted that both the old and new message will appear on the bus. 
                """
                (!request)(!:response-substitute)(receiver-response)

                request: {"type":"request"}
                response-substitute: {"type": "response", "id":100}
                receiver-response: {"type": "receiver-response", "id":100}
                """
                `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                });

            then(`the message flow matches
                `, () => {
                    bubbles.validate();
                    bubblesResult = bubbles.result();
                });

            and(`the flow result has the correct message types`, () => {
                const expectedMessageTypes = ["request", "response", "response", "receiver-response"];
                validateMessageTypes(expectedMessageTypes, bubblesResult);
            });
        });

    });

    // (request-headers)(*status-executing)(>api-request)(!:api-response)(*status-error)