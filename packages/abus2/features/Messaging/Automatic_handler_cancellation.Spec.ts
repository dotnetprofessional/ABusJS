import { CancellationPolicy } from "../../src/ISubscriptionOptions";
import { sleep, MessageLogger, waitUntilAsync } from "../Utils";
import { IMessageHandlerContext, Bus, IMessage } from "../../src";

feature.only(`Automatic handler cancellation
    There are times when a several messages are sent in quick succession and it would be
    a waste of resources to process them all to completion.

    In these scenarios its helpful to be able to automatically cancel or otherwise handle the messages
    differently.

    Rules: defined when subscribing

    cancellationPolicy: cancelExisting | ignoreIfDuplicate | ignoreIfExisting
        cancelExisting:
            when a new message is sent, will set the existing running handlers context to isCancelled.
            This will prevent messages being sent or received by the current instance of the handler. 
            It will not stop the code currently executing within the handler.

        ignoreIfDuplicate:
            when a new message is sent, will compare the message being sent with the message being processed
            by the current handler. If the messages match the message will be ignored.

        ignoreIfExisting:
            when a new message is sent, and the handler is already processing a previous message then 
            the new message will be ignored.

        `, function () {
        let bus: Bus;
        let logger: MessageLogger;
        let messageToSend: IMessage<any>[];

        background(``, () => {
            given(`a handler will send the message 'NOT-SO-FAST' when receiving 'FAST-AND-FURIOUS'`, () => {
                bus = new Bus()
                logger = new MessageLogger();
                bus.start();
                bus.usingRegisteredTransportToMessageType("*").outboundPipeline.useLocalMessagesReceivedTasks(logger);
                const replyType = stepContext.values[0];
                bus.subscribe(stepContext.values[1], async (message: any, context: IMessageHandlerContext) => {
                    // simulate work that will take some time so new messages will be executed before this completes
                    await sleep(40);
                    context.sendAsync({ type: replyType, id: message.id });
                }, { identifier: stepContext.values[1] });

                // register a dummy handler to prevent errors
                bus.subscribe(stepContext.values[0], () => { });
            });
        });

        scenario(`Not specifying the cancellation policy will process every message`, () => {
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
                    await waitUntilAsync(() => logger.messages.length === 10, 100);
                    debugger;
                    const messages = logger.messages;
                    messageToSend = stepContext.docStringAsEntity;
                    for (let i = 0; i < messageToSend.length; i++) {
                        messages[i].type.should.be.eq(messageToSend[i].type);
                        messages[i]["id"].should.be.eq(messageToSend[i]["id"]);
                    }
                    debugger;
                });

        });

        scenario.skip(`Specifying the cancellation policy cancelExisting`, () => {
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
                    await sleep(600);
                    debugger;
                    const messages = logger.messages;
                    messageToSend = stepContext.docStringAsEntity;
                    for (let i = 0; i < messageToSend.length; i++) {
                        messages[i].type.should.be.eq(messageToSend[i].type);
                        messages[i]["id"].should.be.eq(messageToSend[i]["id"]);
                    }
                    debugger;
                });

        });
    });