import "livedoc-mocha";
import { Bubbles } from '../../src';
import { IBubbleFlowResult } from '../../src/IBubbleFlowResult';
import { IMessageHandlerContext } from 'abus2';
import { validateMessageTypes } from './utils';

require("chai").should();

feature(`Override Message
    @link:../Bubbles.md#override

    Provides the ability to override a message which would prevent the message from hitting any handlers. Bubbles would act as the handler
    sending the message.
    `, () => {

        scenarioOutline(`Override messages that are sent with .sendAsync

        Examples:
        | Request Type | Response Type |      Description      |
        |              |               | both sends            |
        |              | *             | response is a publish |

        `, () => {
                let bubbles: Bubbles;
                let bubblesResult: IBubbleFlowResult[];

                given(`a registered handler accepts the message 'request' and sends a message 'response`, () => {
                    bubbles = new Bubbles();

                    bubbles.bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                        context.sendAsync({ type: "substitute-request" });
                    });

                    bubbles.bus.subscribe("substitute-request", async (message: any, context: IMessageHandlerContext) => {
                        throw Error("This shouldn't be called as its overridden by Bubbles!");
                    });
                });

                when(`sending the message 'api-request'
                """
                (!request)(!<Request Type>substitute-request:<Response Type>substitute-response)

                request: {"type":"request"}
                substitute-request: {"type": "substitute-request"}
                substitute-response: {"type":"substitute-response"}
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
                    const expectedMessageTypes = ["request", "substitute-request", "substitute-response"];
                    validateMessageTypes(expectedMessageTypes, bubblesResult);
                });
            });
    });

    // (request-headers)(*status-executing)(>api-request)(!:api-response)(*status-error)