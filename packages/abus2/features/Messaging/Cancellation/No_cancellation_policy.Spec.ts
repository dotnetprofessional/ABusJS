import { sleep, MessageLogger, waitUntilAsync } from "../../Utils";
import { IMessageHandlerContext, Bus, IMessage, MessagePerformanceTask } from "../../../src";

feature(`No cancellation policy
    @link:docs/Cancellation.md

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

        scenario(`Not specifying the cancellation policy will process every message`, () => {
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
    });