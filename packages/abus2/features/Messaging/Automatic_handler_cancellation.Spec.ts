import { CancellationPolicy } from "../../src/ISubscriptionOptions";
import { sleep } from "../Utils";
import { IMessageHandlerContext } from "../../src";
import { Bubbles } from "abus-bubbles";

feature.skip(`Automatic handler cancellation
    There are times when a several messages are sent in quick succession and it would be
    a waste of resources to process them all completion.

    In these scenarios its helpful to be able to automatically cancel or otherwise handle the messages
    differently.

    Rules: subscribing
    
    cancellationPolicy: cancelExisting | ignoreIfDuplicate | ignoreIfExisting
        cancelExisting:
            when a new message is sent, will set the existing running handlers context to isCancelled.
            This will prevent messages being sent or received by the current instance of the handler. 
            It will not stop the code currently executing within the handler.
    
        ignoreIfDuplicate:
            when a new message is sent, will compare the message being sent with message being processed
            by the current handler. If the messages match the message will be ignored.

        ignoreIfExisting:
            when a new message is sent, and the handler is busy the new message will be ignored.

        `, function () {
        this.timeout(5000);

        scenario(`Not specifying the cancellation policy will process every message`, () => {
            let bubbles: Bubbles;
            given(`a handler set configured to handle `, () => {
                bubbles = new Bubbles();
                bubbles.bus.subscribe("FAST-AND-FURIOUS", async (message: any, context: IMessageHandlerContext) => {
                    console.log("I was executed");
                    // simulate work that will take some time so new messages will be executed before this completes
                    await sleep(40);
                    context.sendAsync({ type: "NOT-SO-FAST", id: message.id });
                }, { cancellationPolicy: CancellationPolicy.cancelExisting, identifier: "FURIOUS PROCESS" });
            });
            when(`sending the same message in quick succession
            """
            (!request1)(!request2)(!request3)(!request4)(!request5)(reply1)(reply2)(reply3)(reply4)(reply5)--------------

            request1: {"type":"FAST-AND-FURIOUS",  "id":1}
            request2: {"type":"FAST-AND-FURIOUS", "id":2}
            request3: {"type":"FAST-AND-FURIOUS", "id":3}
            request4: {"type":"FAST-AND-FURIOUS", "id":4}
            request5: {"type":"FAST-AND-FURIOUS", "id":5}
            reply1: {"type": "NOT-SO-FAST", "id":1}
            reply2: {"type": "NOT-SO-FAST", "id":2}
            reply3: {"type": "NOT-SO-FAST", "id":3}
            reply4: {"type": "NOT-SO-FAST", "id":4}
            reply5: {"type": "NOT-SO-FAST", "id":5}
            """        
                `, async () => {
                    debugger;
                    await bubbles.executeAsync(stepContext.docString);
                    debugger;
                });

            then(`the message flow matches
                `, () => {
                    bubbles.validate();
                });

        });

        scenario(`Specifying the cancellation policy cancelExisting`, () => {
            let bubbles: Bubbles;
            given(`a handler set configured to handle `, () => {
                bubbles = new Bubbles();
                bubbles.bus.subscribe("FAST-AND-FURIOUS", async (message: any, context: IMessageHandlerContext) => {
                    console.log("I was executed");
                    // simulate work that will take some time so new messages will be 
                    await sleep(40);
                    context.sendAsync({ type: "NOT-SO-FAST", id: message.id });
                }, { cancellationPolicy: CancellationPolicy.cancelExisting, identifier: "FURIOUS PROCESS" });
            });
            //(!request2)(!request3)--(reply)(!request4)--(reply)(!request5)(reply)-----
            //(!request1)--(!reply)--(!request2)--(reply)
            when(`sending the same message in quick succession
            """
            (!request1)(!request2)(!request3)(!request4)(reply)---

            request1: {"type":"FAST-AND-FURIOUS",  "id":1}
            request2: {"type":"FAST-AND-FURIOUS", "id":2}
            request3: {"type":"FAST-AND-FURIOUS", "id":3}
            request4: {"type":"FAST-AND-FURIOUS", "id":4}
            request5: {"type":"FAST-AND-FURIOUS", "id":5}
            reply: {"type": "NOT-SO-FAST", "id":5}
            """        
                `, async () => {
                    debugger;
                    await bubbles.executeAsync(stepContext.docString);
                    // const result = bubbles.result();
                    console.log(JSON.stringify((bubbles as any).actualMessageFlow, null, 5));
                    debugger;
                });

            then(`the message flow matches
                `, () => {
                    // bubbles.validate();
                });

        });
    });