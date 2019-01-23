import { CancellationPolicy } from "../../src/CancellationPolicy";
import { sleep, MessageLogger, waitUntilAsync } from "../Utils";
import { IMessageHandlerContext, Bus, IMessage, MessagePerformanceTask } from "../../src";

feature.only(`Automatic handler cancellation
    There are times when a several messages are sent in quick succession and it would be
    a waste of resources to process them all to completion.

    In these scenarios its helpful to be able to automatically cancel or otherwise handle the messages
    differently.

    Rules: defined when subscribing

    cancellationPolicy: cancelExisting | ignoreIfDuplicate | ignoreIfExisting
        cancelExisting:
            when a new message is sent, will set the existing running handlers context to wasCancelled.
            This will prevent messages being sent or received by the current instance of the handler. 
            It will not stop the code currently executing within the handler.

            Using reply:
            In this scenario the caller is waiting for a response. As such even if the handler is cancelled
            the caller must still receive a response otherwise it will wait forever. Returning an empty response
            however would still allow the code to execute afterwards, which could lead to unexpected results.
            As such the Abus will thrown a "ReplyHandlerCancelled" exception. This can then be handled and ignored
            or handled as appropriate. Its also important to note that the reply will still be delivered with the
            payload being this exception as this is the only way to communicate with the caller.

            Using send/publish:
            In this scenario a handler is attempting to dispatch a message after the handler has been cancelled. As
            these are fire and forget methods. Abus will simply not dispatch the message.

            Using sendWithReply:
            This scenario has the same behavior as reply. The only difference is that if the handler has been cancelled
            prior to sending the message then the message will not be dispatched and the "ReplyHandlerCancelled" will be
            thrown back to the caller.

        ignoreIfDuplicate:
            when a new message is sent, will compare the message being sent with the message being processed
            by the current handler. If the messages match the message will be ignored.

        ignoreIfExisting:
            when a new message is sent, and the handler is already processing a previous message then 
            the new message will be ignored.

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

        scenario.skip(`Not specifying the cancellation policy will process every message`, () => {
            given(`a handler for 'FAST-AND-FURIOUS' sends a message 'NOT-SO-FAST' and has NO cancellation policy defined `, () => {
                const replyType = stepContext.values[1];
                bus.subscribe(stepContext.values[0], async (message: any, context: IMessageHandlerContext) => {
                    // simulate work that will take some time so new messages will be executed before this completes
                    // console.log(message.type + ": " + message.id);
                    await sleep(40);
                    context.sendAsync({ type: replyType, id: message.id });
                }, { identifier: stepContext.values[1] });

            });

            when(`sending the same message 'FAST-AND-FURIOUS' in quick succession`, () => {
                for (let i = 1; i <= 5; i++) {
                    bus.sendAsync({ type: stepContext.values[0], id: i });
                }
            });

            then(`the message flow matches
                """
                [{"type":"FAST-AND-FURIOUS",  "id":1},
                {"type":"FAST-AND-FURIOUS", "id":2},
                {"type":"FAST-AND-FURIOUS", "id":3},
                {"type":"FAST-AND-FURIOUS", "id":4},
                {"type":"FAST-AND-FURIOUS", "id":5},
                {"type": "NOT-SO-FAST", "id":1},
                {"type": "NOT-SO-FAST", "id":2},
                {"type": "NOT-SO-FAST", "id":3},
                {"type": "NOT-SO-FAST", "id":4},
                {"type": "NOT-SO-FAST", "id":5}
                ]
                """        
                `, async () => {
                    await waitUntilAsync(() => outboundLogger.messages.length >= 10, 100);
                    await sleep(10); // provide a little buffer to ensure additional messages don't arrive unexpectedly
                    const messages = outboundLogger.messages;
                    messageToSend = stepContext.docStringAsEntity;
                    for (let i = 0; i < messageToSend.length; i++) {
                        messages[i].type.should.be.eq(messageToSend[i].type);
                        messages[i]["id"].should.be.eq(messageToSend[i]["id"]);
                    }
                });

        });

        scenario.skip(`Specifying the cancellation policy cancelExisting`, () => {
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

            then(`the message flow matches
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
                    await waitUntilAsync(() => outboundLogger.messages.length >= messageToSend.length, 100);
                    await sleep(10); // provide a little buffer to ensure additional messages don't arrive unexpectedly

                    const messages = outboundLogger.messages;
                    for (let i = 0; i < messageToSend.length; i++) {
                        messages[i].type.should.be.eq(messageToSend[i].type, "for index: " + i);
                        messages[i]["id"].should.be.eq(messageToSend[i]["id"], "for index: " + i);
                    }
                });

        });

        scenario(`Specifying the cancellation policy cancelExisting with request/response pattern`, () => {
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
                        const result = await bus.sendWithReply({ type: stepContext.values[0], id: index }).responseAsync<{ type: string, id: number }>();
                    } catch (e) {
                        // console.log(`ERROR: name: ${e.name} - ${e.message}`);
                    }
                };

                for (let i = 1; i <= 5; i++) {
                    executeHandler(i);
                }
            });

            then(`the message flow matches
                """
                [{"type":"FAST-AND-FURIOUS",  "id":1},
                {"type":"FAST-AND-FURIOUS", "id":2},
                {"type":"FAST-AND-FURIOUS", "id":3},
                {"type":"FAST-AND-FURIOUS", "id":4},
                {"type":"FAST-AND-FURIOUS", "id":5},
                {"type":"FAST-AND-FURIOUS.reply","payload": {"error": {"name": "ReplyHandlerCancelled","reply": {"type": "NOT-SO-FAST","id": 1}}}},
                {"type":"FAST-AND-FURIOUS.reply","payload": {"error": {"name": "ReplyHandlerCancelled","reply": {"type": "NOT-SO-FAST","id": 2}}}},
                {"type":"FAST-AND-FURIOUS.reply","payload": {"error": {"name": "ReplyHandlerCancelled","reply": {"type": "NOT-SO-FAST","id": 3}}}},
                {"type":"FAST-AND-FURIOUS.reply","payload": {"error": {"name": "ReplyHandlerCancelled","reply": {"type": "NOT-SO-FAST","id": 4}}}},
                {"type": "FAST-AND-FURIOUS.reply", "payload": {"type": "NOT-SO-FAST","id": 5}}
                ]
                """        
                `, async () => {
                    messageToSend = stepContext.docStringAsEntity;
                    await waitUntilAsync(() => outboundLogger.messages.length >= messageToSend.length, 200);
                    await sleep(10); // provide a little buffer to ensure additional messages don't arrive unexpectedly
                    debugger;
                    const messages = outboundLogger.messages;
                    for (let i = 0; i < 5; i++) {
                        messages[i].type.should.be.eq(messageToSend[i].type);
                        messages[i]["id"].should.be.eq(messageToSend[i]["id"]);
                    }

                    console.log(JSON.stringify(messages, null, 5));
                    for (let i = 5; i < 9; i++) {
                        console.log(i);
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
    });