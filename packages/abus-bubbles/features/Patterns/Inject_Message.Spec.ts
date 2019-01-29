import "livedoc-mocha";
import { Bubbles } from '../../src';
import { IBubbleFlowResult } from '../../src/IBubbleFlowResult';
import { IMessageHandlerContext } from 'abus2';
import { validateMessageTypes } from './utils';

require("chai").should();

feature(`Inject Message 
    @link:../Bubbles.md#inject

    Provides the ability to inject messages into the flow that wouldn't normally have been generated.
    `, () => {

        scenario(`Send multiple messages to handler`, () => {
            let bubbles: Bubbles;
            let bubblesResult: IBubbleFlowResult[];

            given(`a registered handler accepts the message 'request' and sends a message 'response`, () => {
                bubbles = new Bubbles();

                bubbles.bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    context.sendAsync({ type: "response" });
                });
            });

            when(`sending the message 'api-request'
                """
                (!request1)(!request2)(!request3)(response1)(response2)(response3)

                request1: {"type":"request"}
                response1: {"type": "response"}
                request2: {"type":"request"}
                response2: {"type": "response"}
                request3: {"type":"request"}
                response3: {"type": "response"}
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
                const expectedMessageTypes = ["request", "request", "request", "response", "response", "response"];
                validateMessageTypes(expectedMessageTypes, bubblesResult);
            });
        });

    });

    // (request-headers)(*status-executing)(>api-request)(!:api-response)(*status-error)