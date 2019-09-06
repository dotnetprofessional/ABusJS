import "livedoc-mocha";
import { Bubbles } from '../../src';
import { IBubbleFlowResult } from '../../src/IBubbleFlowResult';
import { IMessageHandlerContext } from 'abus';
import { validateMessageTypes } from './utils';

require("chai").should();

feature(`Request Response Pattern
    @link:../Bubbles.md#request-response

    Provides the ability to validate the request response pattern. This is achieved by using
    the .sendWithReplyAsync method.
    `, () => {

        scenario(`A request/response initiated by a handler`, () => {
            let bubbles: Bubbles;
            let bubblesResult: IBubbleFlowResult[];
            let requestReceived: boolean = false;

            given(`a registered handler for the 'api-request' sends a request/response`, () => {
                bubbles = new Bubbles();

                bubbles.bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    await context.sendWithReplyAsync<boolean>({ type: "request" });
                });

                bubbles.bus.subscribe("request", async (message: any, context: IMessageHandlerContext) => {
                    context.replyAsync("response");
                    requestReceived = true;
                });

            });

            when(`sending the message 'api-request'
                """
                (!api-request)(>request)(@response)

                api-request: {"type":"api-request"}
                request: {"type":"request"}
                response: "response"
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
                const expectedMessageTypes = ["api-request", "request", "request.reply"];
                validateMessageTypes(expectedMessageTypes, bubblesResult);
            });

            and(`the reply handler was called`, () => {
                requestReceived.should.be.eq(true);
            });
        });

        scenario(`Overriding a request/response initiated by a handler`, () => {
            let bubbles: Bubbles;
            let bubblesResult: IBubbleFlowResult[];

            given(`a registered handler for the 'api-request' sends a request/response`, () => {
                bubbles = new Bubbles();

                bubbles.bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    await context.sendWithReplyAsync({ type: "request" });
                });

                bubbles.bus.subscribe("request", async (message: any, context: IMessageHandlerContext) => {
                    throw new Error("This should not be hit as bubbles overrides the handler!");
                });

            });

            when(`sending the message 'api-request'
                """
                (!api-request)(!>request:@response)

                api-request: {"type":"api-request"}
                request: {"type":"request"}
                response: "response"
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
                const expectedMessageTypes = ["api-request", "request", "request.reply"];
                validateMessageTypes(expectedMessageTypes, bubblesResult);
            });
        });

        scenario(`Overriding a request/response initiated by a handler with a delay`, () => {
            let bubbles: Bubbles;
            let bubblesResult: IBubbleFlowResult[];

            given(`a registered handler for the 'api-request' sends a request/response`, () => {
                bubbles = new Bubbles();

                bubbles.bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    await context.sendWithReplyAsync({ type: "request" });
                }, { identifier: "ProcessA" });

                bubbles.bus.subscribe("request", async (message: any, context: IMessageHandlerContext) => {
                    throw new Error("This should not be hit as bubbles overrides the handler!");
                }, { identifier: "ProcessB" });

            });

            when(`sending the message 'api-request'
                """
                (!api-request)(!>request:---@response)

                api-request: {"type":"api-request"}
                request: {"type":"request"}
                response: "response"
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
                const expectedMessageTypes = ["api-request", "request", "request.reply"];
                validateMessageTypes(expectedMessageTypes, bubblesResult);
            });
        });
    });