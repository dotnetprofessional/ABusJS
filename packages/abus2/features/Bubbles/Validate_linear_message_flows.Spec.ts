import { Bubbles } from "../../src/bubbles/Bubbles";
import { IBus, Bus, IMessageHandlerContext } from "../../src";

feature(`Validate linear message flows
    Provides the ability to validate simple linear message flows
    `, () => {

        scenario(`Validate that sending a message to a handler is received by the handler`, () => {
            let bubbles: Bubbles;
            let bus: IBus;
            let bubblesResult: any;

            given(`a registered handler for 'request'`, () => {
                bus = new Bus();
                bus.start();
                bus.subscribe(stepContext.values[0], (m, c: IMessageHandlerContext) => {
                    c.sendAsync({ type: "response" });
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
                    bubblesResult = await bubbles.execute(stepContext.docString);
                });

            then(`the message flow matches
            `, () => {
                    bubbles.validate();
                });
        });

        scenario(`x`, () => {
            let bubbles: Bubbles;
            let bus: IBus;
            let bubblesResult: any;

            given(`a registered handler for 'authorize-user'`, () => {
                bus = new Bus();
                bus.start();
                bus.subscribe(stepContext.values[0], async (m, c: IMessageHandlerContext) => {
                    const result = await c.sendWithReply({ type: "authorize" }).responseAsync<string>();
                    c.replyAsync(result);
                });

                bubbles = new Bubbles(bus);
            });

            when(`sending the message 'request'
                """
                (!<authorize-user)(authorize)(!:authorize-reply)(:authorize-user-reply)

                authorize-user: {"type":"authorize-user"}
                authorize: {"type": "authorize"}
                authorize-reply: "authorized"
                authorize-user-reply: "authorized"
                """        
            `, async () => {
                    bubblesResult = await bubbles.execute(stepContext.docString);
                });

            then(`the message flow matches
            `, () => {
                    bubbles.validate();
                });
        });
    });