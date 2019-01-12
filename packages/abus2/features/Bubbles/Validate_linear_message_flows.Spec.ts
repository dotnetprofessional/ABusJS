import { Bubbles } from "../../src/bubbles/Bubbles";
import { IBus, Bus, IMessageHandlerContext } from "../../src";
import { IBubbleFlowResult } from "../../src/bubbles/Bubble";
require("chai").should();

feature(`Linear message flows
    Provides the ability to validate simple linear message flows
    `, () => {

        scenario(`first message must be supplied`, () => {
            let bubbles: Bubbles;
            let bus: IBus;
            let errorResult: Error;

            given(`a registered handler for 'request'`, () => {
                bus = new Bus();
                bus.start();
                bubbles = new Bubbles(bus);
            });

            when(`sending the message 'request'
                """
                (request)

                request: {"type":"request"}
                """        
            `, async () => {
                    try {
                        await bubbles.executeAsync(stepContext.docString);
                    } catch (e) {
                        errorResult = e;
                    }
                });

            then(`the following error is thrown
                """
                The first bubble in a definition must be marked as supplied ie (!my-first-bubble)
                """
            `, () => {
                    errorResult.message.should.eq(stepContext.docString);
                });
        });

        scenario(`first message is sent`, () => {
            let bubbles: Bubbles;
            let bubblesResult: IBubbleFlowResult[];
            let handlerWasCalled: boolean = false;

            given(`a registered handler for 'request'`, () => {
                bubbles = new Bubbles();
                bubbles.bus.subscribe(stepContext.values[0], () => {
                    handlerWasCalled = true;
                });
            });

            when(`sending the message 'request'
                """
                (!request)

                request: {"type":"request"}
                """        
            `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                    bubblesResult = bubbles.result();
                });

            then(`the message flow matches
            `, () => {
                    bubbles.validate();
                });

            and(`the flow result has the correct messages`, () => {
                const expectedMessageTypes = ["request"];
                validateMessageTypes(expectedMessageTypes, bubblesResult);
            });

            and(`the handler has invoked`, () => {
                handlerWasCalled.should.be.true;
            });
        });

        scenario(`message handler sends a response`, () => {
            let bubbles: Bubbles;
            let bus: IBus;
            let bubblesResult: IBubbleFlowResult[];

            given(`a registered handler for 'request' sends the message 'response'`, () => {
                bus = new Bus();
                bus.start();
                const msg = { type: stepContext.values[1] };
                bus.subscribe(stepContext.values[0], (m, c: IMessageHandlerContext) => {
                    c.sendAsync(msg);
                });

                bubbles = new Bubbles(bus);
            });

            when(`sending the message 'request'
                """
                (!request)(response)

                request: {"type":"request"}
                response: {"type": "response"}
                """
            `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                    bubblesResult = bubbles.result();
                });

            then(`the message flow matches
            `, () => {
                    bubbles.validate();
                });

            and(`the flow result has the correct messages`, () => {
                const expectedMessageTypes = ["request", "response"];

                validateMessageTypes(expectedMessageTypes, bubblesResult);
            });
        });

        scenario(`message handler overridden by supplied message`, () => {
            let bubbles: Bubbles;
            let bus: IBus;
            let bubblesResult: IBubbleFlowResult[];

            given(`a registered handler for 'request' sends the message 'response'`, () => {
                bus = new Bus();
                bus.start();
                bus.subscribe(stepContext.values[0], (m, c: IMessageHandlerContext) => {
                    throw new Error("This should not be hit as bubbles overrides the handler!");
                });

                bubbles = new Bubbles(bus);
            });

            when(`sending the message 'request'
                """
                (!request)(!response)

                request: {"type":"request"}
                response: {"type": "response", "unittest": true}
                """
            `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                    bubblesResult = bubbles.result();
                });

            then(`the message flow matches
            `, () => {
                    bubbles.validate();
                });

            and(`the flow result has the correct message types`, () => {
                const expectedMessageTypes = ["request", "response"];
                validateMessageTypes(expectedMessageTypes, bubblesResult);
            });

            and(`the response is the one supplied by the test`, () => {
                bubblesResult[1].actual["unittest"].should.eql(true);
            });
        });

        scenario(`handler sends request with reply`, () => {
            let bubbles: Bubbles;
            let bus: IBus;
            let bubblesResult: IBubbleFlowResult[];

            given(`a registered handler for 'request' makes an API call`, () => {
                bus = new Bus();
                bus.start();
                bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    await context.sendWithReply({ type: "api-call" }).responseAsync();
                });

                bus.subscribe("api-call", (message: any, context: IMessageHandlerContext) => {
                    context.replyAsync({ orderId: "123456" });
                });

                bubbles = new Bubbles(bus);
            });

            when(`sending the message 'request'
                """
                (!request)(api-call)(:api-call-reply)

                request: {"type":"request"}
                api-call: {"type": "api-call"}
                api-call-reply: {"orderId":"123456"}
                """        
            `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                    bubblesResult = bubbles.result();
                });

            then(`the message flow matches
            `, () => {
                    bubbles.validate();
                });

            and(`the flow result has the correct message types`, () => {
                const expectedMessageTypes = ["request", "api-call", "api-call.reply"];
                validateMessageTypes(expectedMessageTypes, bubblesResult);
            });
        });

        scenario(`first message is sent with reply`, () => {
            let bubbles: Bubbles;
            let bus: IBus;
            let bubblesResult: IBubbleFlowResult[];

            given(`a registered handler for 'request' returns a reply`, () => {
                bus = new Bus();
                bus.start();
                bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    context.replyAsync("response");
                });

                bubbles = new Bubbles(bus);
            });

            when(`sending the message 'request'
                """
                (!>request)(:response))

                request: {"type":"request"}
                response: "response"
                """        
            `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                    bubblesResult = bubbles.result();
                });

            then(`the message flow matches
            `, () => {
                    bubbles.validate();
                });

            and(`the flow result has the correct message types`, () => {
                const expectedMessageTypes = ["request", "request.reply"];
                validateMessageTypes(expectedMessageTypes, bubblesResult);
            });
        });

        scenario(`message handler overridden by supplied reply message`, () => {
            let bubbles: Bubbles;
            let bus: IBus;
            let bubblesResult: IBubbleFlowResult[];

            given(`a registered handler for 'request' returns a reply`, () => {
                bus = new Bus();
                bus.start();
                bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    throw new Error("This should not be hit as bubbles overrides the handler!");
                });

                bubbles = new Bubbles(bus);
            });

            when(`sending the message 'request'
                """
                (!>request)(!:response))

                request: {"type":"request"}
                response: "response"
                """        
                `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                    bubblesResult = bubbles.result();
                });

            then(`the message flow matches
                `, () => {
                    bubbles.validate();
                });

            and(`the flow result has the correct message types`, () => {
                const expectedMessageTypes = ["request", "request.reply"];
                validateMessageTypes(expectedMessageTypes, bubblesResult);
            });
        });

        scenario(`handler publishes a message`, () => {
            let bubbles: Bubbles;
            let bus: IBus;
            let bubblesResult: IBubbleFlowResult[];

            given(`a registered handler for 'request' returns a reply`, () => {
                bus = new Bus();
                bus.start();
                bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    context.publishAsync({ type: "response" });
                });

                bubbles = new Bubbles(bus);
            });

            when(`sending the message 'request'
                """
                (!request)(*response))

                request: {"type":"request"}
                response: {"type": "response"}
                """        
                `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                    bubblesResult = bubbles.result();
                });

            then(`the message flow matches
                `, () => {
                    bubbles.validate();
                });

            and(`the flow result has the correct message types`, () => {
                const expectedMessageTypes = ["request", "response"];
                validateMessageTypes(expectedMessageTypes, bubblesResult);
            });
        });

        scenario(`message handler overridden by supplied message that is published`, () => {
            let bubbles: Bubbles;
            let bus: IBus;
            let bubblesResult: IBubbleFlowResult[];

            given(`a registered handler for 'request' returns a reply`, () => {
                bus = new Bus();
                bus.start();
                bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    throw new Error("This should not be hit as bubbles overrides the handler!");
                });

                bubbles = new Bubbles(bus);
            });

            when(`sending the message 'request'
                """
                (!request)(!*response))

                request: {"type":"request"}
                response: {"type": "response"}
                """        
                `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                    bubblesResult = bubbles.result();
                });

            then(`the message flow matches
                `, () => {
                    bubbles.validate();
                });

            and(`the flow result has the correct message types`, () => {
                const expectedMessageTypes = ["request", "response"];
                validateMessageTypes(expectedMessageTypes, bubblesResult);
            });
        });

        scenario(`handler throws an error`, () => {
            let bubbles: Bubbles;
            let bus: IBus;
            let bubblesResult: IBubbleFlowResult[];

            given(`a registered handler for 'request' returns a reply`, () => {
                bus = new Bus();
                bus.start();
                bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    throw new Error("I'm blowing up on purpose!");
                });

                bubbles = new Bubbles(bus);
            });

            when(`sending the message 'request'
                """
                (!request)(response)

                request: {"type":"request"}
                response: {"error":"I'm blowing up on purpose!"}
                """        
                `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                    bubblesResult = bubbles.result();
                });

            then(`the message flow matches
                `, () => {
                    bubbles.validate();
                });

            and(`the flow result has the correct message types`, () => {
                const expectedMessageTypes = ["request", "Bus.Error"];
                validateMessageTypes(expectedMessageTypes, bubblesResult);
            });
        });

        scenario(`Bubble flow can include delays at the end of flow`, () => {
            let bubbles: Bubbles;
            let bus: IBus;
            let bubblesResult: IBubbleFlowResult[];
            let executionTime: number;

            given(`a registered handler for 'request' returns a reply`, () => {
                bus = new Bus();
                bus.start();
                bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    context.sendAsync({ type: "response" });
                });

                bubbles = new Bubbles(bus);
            });

            when(`sending the message 'request'
                """
                (!request)(response)------

                request: {"type":"request"}
                response: {"type": "response"}
                """        
                `, async () => {
                    debugger;
                    const startTime = Date.now();
                    await bubbles.executeAsync(stepContext.docString);
                    executionTime = Date.now() - startTime;
                    bubblesResult = bubbles.result();
                    debugger;
                });

            then(`the message flow matches
                `, () => {
                    bubbles.validate();
                });

            and(`the flow result has the correct message types`, () => {
                const expectedMessageTypes = ["request", "response"];
                validateMessageTypes(expectedMessageTypes, bubblesResult);
            });

            and(`the response message was delayed by '60' ms`, () => {
                executionTime.should.be.greaterThan(stepContext.values[0] - 1);
            });

        });

        function validateMessageTypes(messageTypes: string[], results: IBubbleFlowResult[]) {
            // ensure we have the same number of messages
            if (messageTypes.length != results.length) {
                throw new Error(`Message count mismatch: expected ${messageTypes.length} received: ${results.length}`);
            }

            for (let i = 0; i < messageTypes.length; i++) {
                const expected = messageTypes[i];
                const actual = results[i].actual.type;
                if (actual !== expected) {
                    throw new Error(`Message type mismatch: expected '${expected}' received: '${actual}'`)
                }
            }
        }
    });