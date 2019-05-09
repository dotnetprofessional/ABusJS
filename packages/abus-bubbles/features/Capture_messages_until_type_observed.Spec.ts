import "livedoc-mocha";
import { Bubbles } from "../src/Bubbles";
import { IBubbleFlowResult } from "../src/IBubbleFlowResult";
import { IBus, Bus, IMessageHandlerContext } from 'abus';
import { BubbleIntent } from '../src/BubbleIntent';

require("chai").should();

feature(`Capture messages until a type is observed
    Provides the ability to capture messages until a terminate message is observed.
    
    This option is useful when you have a complex flow but do not care about the intermediate messages only the
    last one.
    `, () => {

        scenario(`sending terminate on specified message type`, () => {
            let bubbles: Bubbles;
            let bus: IBus;

            given(`a registered handler for 'authorize-user'`, () => {
                bus = new Bus();
                bus.start();
                bus.subscribe(stepContext.values[0], async (m, c: IMessageHandlerContext) => {
                    const result = await c.sendWithReplyAsync<string>({ type: "authorize", payload: { authorizedUser: m.user } });
                    c.replyAsync(result);
                }, { identifier: "AuthenticationService" });

                bus.subscribe("authorize", (message: any, context: IMessageHandlerContext) => {
                    const result = message.authorizedUser === "user1" ? "authorized" : "unauthorized";
                    context.replyAsync(result);
                }, { identifier: "AuthenticationService" });

                bubbles = new Bubbles(bus);
            });

            when(`sending the message 'request'
                """
                {"type":"authorize-user", "payload":{"user":"user1"}}
                """
            `, async () => {
                    await bubbles.executeUntilAsync(BubbleIntent.sendReply, stepContext.docStringAsEntity, "authorize-user.reply");
                });

            then(`the last message matches
                """
                {
                    "type": "authorize-user.reply",
                    "payload": "authorized"
                }
                """
                `, () => {
                    const lastMessage = bubbles.lastObservedMessage();
                    bubbles.partialMatch(lastMessage, stepContext.docStringAsEntity);
                });
        });
    });

