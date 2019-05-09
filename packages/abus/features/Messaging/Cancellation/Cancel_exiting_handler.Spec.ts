import { CancellationPolicy } from "../../../src/CancellationPolicy";
import { sleep, MessageLogger, waitUntilAsync } from "../../Utils";
import { IMessageHandlerContext, Bus, IMessage, MessagePerformanceTask } from "../../../src";

feature(`Cancel existing handler
    @link:docs/Cancellation.md#cancelExisting

    Applying the cancelExisting cancellation policy to a subscription
        `, function () {
        let bus: Bus;
        let outboundLogger: MessageLogger;
        let inboundLogger: MessageLogger;
        let messageToSend: IMessage<any>[];

        background(``, () => {
            given(`a handler for 'NOT-SO-FAST' exists`, () => {
                bus = new Bus();
                outboundLogger = new MessageLogger();
                inboundLogger = new MessageLogger();
                bus.start();
                bus.usingRegisteredTransportToMessageType("*")
                    .outboundPipeline.useLocalMessagesReceivedTasks(outboundLogger).andAlso()
                    .inboundPipeline.useLocalMessagesReceivedTasks(inboundLogger).and
                    .useTransportMessageReceivedTasks(new MessagePerformanceTask());
                // register a dummy handler to prevent errors
                bus.subscribe(stepContext.values[0], (message: any) => {
                    // console.log(message.type + ": " + message.id);
                });
            });
        });

        scenario(`Sending a message in quick succession`, () => {
            given(`a handler for 'FAST-AND-FURIOUS' sends a message 'NOT-SO-FAST' and has the cancelIfExisting policy defined `, () => {
                const replyType = stepContext.values[1];
                bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    // simulate work that will take some time so new messages will be executed before this completes
                    // console.log(message.type + ": " + message.id);
                    await sleep(40);
                    context.sendAsync({ type: replyType, id: message.id });
                }, { cancellationPolicy: CancellationPolicy.cancelExisting, identifier: stepContext.values[1] });

            });

            when(`sending the same message 'FAST-AND-FURIOUS' in quick succession`, () => {
                for (let i = 1; i <= 5; i++) {
                    bus.sendAsync({ type: stepContext.values[0], id: i });
                }
            });

            // this test is fairly flaky due to the timing of messages running the test 3x typically gets a success run :(
            then(`the handler will only send a response for the last message
                """
                [{"type":"FAST-AND-FURIOUS",  "id":1},
                {"type":"FAST-AND-FURIOUS", "id":2},
                {"type":"FAST-AND-FURIOUS", "id":3},
                {"type":"FAST-AND-FURIOUS", "id":4},
                {"type":"FAST-AND-FURIOUS", "id":5},
                {"type": "NOT-SO-FAST", "id":5}
                ]
                """        
                `, async () => {
                    messageToSend = stepContext.docStringAsEntity;
                    await waitUntilAsync(() => outboundLogger.messages.length >= messageToSend.length, 200);
                    await sleep(500); // provide a little buffer to ensure additional messages don't arrive unexpectedly

                    const messages = outboundLogger.messages;
                    messages.length.should.eq(messageToSend.length);
                    for (let i = 0; i < messageToSend.length; i++) {
                        messages[i].type.should.be.eq(messageToSend[i].type, "for index: " + i);
                        messages[i]["id"].should.be.eq(messageToSend[i]["id"], "for index: " + i);
                    }
                });

        });

        scenario(`Sending a message in quick succession using the .sendWithReplyAsync method`, () => {
            given(`a handler for 'FAST-AND-FURIOUS' replies to the message 'NOT-SO-FAST' and has the cancelIfExisting policy defined `, () => {
                const replyType = stepContext.values[1];
                bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    // simulate work that will take some time so new messages will be executed before this completes
                    // console.log(message.type + ": " + message.id);
                    await sleep(40);
                    context.replyAsync({ type: replyType, id: message.id });
                }, { cancellationPolicy: CancellationPolicy.cancelExisting, identifier: stepContext.values[1] });

            });

            when(`sending the same message 'FAST-AND-FURIOUS' in quick succession`, () => {
                const executeHandler = async (index: number) => {
                    try {
                        const result = await bus.sendWithReplyAsync<{ type: string, id: number }>({ type: stepContext.values[0], id: index });
                    } catch (e) {
                        // console.log(`ERROR: name: ${e.name} - ${e.message}`);
                    }
                };

                for (let i = 1; i <= 5; i++) {
                    executeHandler(i);
                }
            });

            then(`the handler will send errors for each cancelled request and a valid response for the last message
                """
                [{"type":"FAST-AND-FURIOUS",  "id":1},
                {"type":"FAST-AND-FURIOUS", "id":2},
                {"type":"FAST-AND-FURIOUS", "id":3},
                {"type":"FAST-AND-FURIOUS", "id":4},
                {"type":"FAST-AND-FURIOUS", "id":5},
                {"type":"FAST-AND-FURIOUS.reply","payload": {"error": {"name": "ReplyHandlerCancelledException","reply": {"type": "NOT-SO-FAST","id": 1}}}},
                {"type":"FAST-AND-FURIOUS.reply","payload": {"error": {"name": "ReplyHandlerCancelledException","reply": {"type": "NOT-SO-FAST","id": 2}}}},
                {"type":"FAST-AND-FURIOUS.reply","payload": {"error": {"name": "ReplyHandlerCancelledException","reply": {"type": "NOT-SO-FAST","id": 3}}}},
                {"type":"FAST-AND-FURIOUS.reply","payload": {"error": {"name": "ReplyHandlerCancelledException","reply": {"type": "NOT-SO-FAST","id": 4}}}},
                {"type": "FAST-AND-FURIOUS.reply", "payload": {"type": "NOT-SO-FAST","id": 5}}
                ]
                """        
                `, async () => {
                    messageToSend = stepContext.docStringAsEntity;
                    await waitUntilAsync(() => outboundLogger.messages.length >= messageToSend.length, 200);
                    await sleep(10); // provide a little buffer to ensure additional messages don't arrive unexpectedly
                    const messages = outboundLogger.messages;
                    messages.length.should.eq(messageToSend.length);
                    for (let i = 0; i < 5; i++) {
                        messages[i].type.should.be.eq(messageToSend[i].type);
                        messages[i]["id"].should.be.eq(messageToSend[i]["id"]);
                    }

                    for (let i = 5; i < 9; i++) {
                        const message: any = messages[i] as any;
                        message.type.should.be.eq(messageToSend[i].type);
                        message.payload.error.name.should.be.eq(messageToSend[i].payload.error.name);
                        message.payload.error.reply.id.should.be.eq(messageToSend[i].payload.error.reply.id);
                    }

                    const i: number = 9;
                    messages[i].type.should.be.eq(messageToSend[i].type);
                    messages[i].payload.id.should.be.eq(messageToSend[i].payload.id);
                });

        });

        scenario(`Sending a series of messages at different intervals`, () => {
            given(`a handler for 'FAST-AND-FURIOUS' sends a message 'NOT-SO-FAST' and has the cancelExisting policy defined `, () => {
                const replyType = stepContext.values[1];
                bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    // simulate work that will take some time so new messages will be executed before this completes
                    // console.log(message.type + ": " + message.id);
                    await sleep(20);
                    context.sendAsync({ type: replyType, id: message.id });
                }, { cancellationPolicy: CancellationPolicy.cancelExisting, identifier: stepContext.values[1] });

            });
            and(`it takes 20ms to process the message`, () => {

            });

            when(`sending the message 'FAST-AND-FURIOUS' with id '1'`, () => {
                bus.sendAsync({ type: stepContext.values[0], id: stepContext.values[1] });
            });

            and(`waiting '5'ms before sending the same message'`, async () => {
                await sleep(stepContext.values[0]);
                bus.sendAsync({ type: 'FAST-AND-FURIOUS', id: 1 });
            });

            and(`sending the message 'FAST-AND-FURIOUS' with id '2'`, () => {
                bus.sendAsync({ type: stepContext.values[0], id: stepContext.values[1] });
            });

            and(`waiting '30'ms before sending the same message'`, async () => {
                await sleep(stepContext.values[0]);
                bus.sendAsync({ type: 'FAST-AND-FURIOUS', id: 2 });
            });

            and(`sending the message 'FAST-AND-FURIOUS' with id '1' again`, () => {
                bus.sendAsync({ type: 'FAST-AND-FURIOUS', id: 1 });
            });

            then(`the handler will only send a response once for each message unique message
                """
                [{"type":"FAST-AND-FURIOUS",  "id":1},
                {"type":"FAST-AND-FURIOUS", "id":1},
                {"type":"FAST-AND-FURIOUS", "id":2},
                {"type": "NOT-SO-FAST", "id":2},
                {"type":"FAST-AND-FURIOUS", "id":2},
                {"type":"FAST-AND-FURIOUS", "id":1},
                {"type": "NOT-SO-FAST", "id":1}
                ]
                """
                `, async () => {
                    messageToSend = stepContext.docStringAsEntity;
                    await waitUntilAsync(() => outboundLogger.messages.length >= messageToSend.length, 200);
                    await sleep(10); // provide a little buffer to ensure additional messages don't arrive unexpectedly

                    const messages = outboundLogger.messages;
                    messages.length.should.eq(messageToSend.length);
                    for (let i = 0; i < messageToSend.length; i++) {
                        messages[i].type.should.be.eq(messageToSend[i].type, "for index: " + i);
                        messages[i]["id"].should.be.eq(messageToSend[i]["id"], "for index: " + i);
                    }
                });

        });
    });