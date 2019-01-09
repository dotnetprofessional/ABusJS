import { Bubbles } from "../../src/bubbles/Bubbles";
import { IBus, Bus, IMessageHandlerContext } from "../../src";
import "chai";

feature(`Validate bubbles works with more complex workflows`, () => {
    scenarioOutline(`Authorize user form an API
        This scenario simulates authenticating a user against an API and supplying different inputs to the flow
        The only input supplied by the test/spec is the first message to request authorization of a particular user.

        Examples:
        | user  | authorized-user-reply |
        | user1 | authorized            |
        | user2 | unauthorized          |

        `, () => {
            let bubbles: Bubbles;
            let bus: IBus;

            given(`a registered handler for 'authorize-user'`, () => {
                bus = new Bus();
                bus.start();
                bus.subscribe(stepContext.values[0], async (m, c: IMessageHandlerContext) => {
                    const result = await c.sendWithReply({ type: "authorize", payload: { authorizedUser: m.user } }).responseAsync<string>();
                    c.replyAsync(result);
                }, "AuthenticationService");

                bus.subscribe("authorize", (message: any, context: IMessageHandlerContext) => {
                    const result = message.authorizedUser === "user1" ? "authorized" : "unauthorized";
                    context.replyAsync(result);
                }, "AuthorizationService");

                bubbles = new Bubbles(bus);
            });

            when(`sending the message 'request'
                """
                (!>authorize-user)(authorize-api)(:authorize-api-reply)(:authorize-user-reply)

                authorize-user: {"type":"authorize-user", "payload":{"user":"<user>"}}
                authorize-api: {"type": "authorize", "payload":{"authorizedUser":"<user>"}}
                authorize-api-reply: "<authorized-user-reply>"
                authorize-user-reply: "<authorized-user-reply>"
                """        
            `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                });

            then(`the message flow matches
        `, () => {
                    bubbles.validate();
                });
        });

    scenarioOutline.skip(`Authenticate User 
        ** SCENARIO DOESN'T WARRANT A SAGA - NEEDS TO BE REWORKED ***
        This scenario simulates authenticating a user and if required also requiring 2FA authentication. This 
        example also uses a SAGA to control the business logic.

        Examples:
        | user  | authorized-user-reply |
        | user1 | authorized            |
        | user2 | unauthorized          |

        `, () => {
            let bubbles: Bubbles;
            let bus: IBus;

            given(`a registered handler for 'authorize-user'`, () => {
                bus = new Bus();
                bus.start();
                bus.subscribe(stepContext.values[0], async (m, c: IMessageHandlerContext) => {
                    const result = await c.sendWithReply({ type: "authorize", payload: { authorizedUser: m.user } }).responseAsync<string>();
                    c.replyAsync(result);
                });

                bus.subscribe("authorize", (message: any, context: IMessageHandlerContext) => {
                    const result = message.authorizedUser === "user1" ? "authorized" : "unauthorized";
                    context.replyAsync(result);
                });

                bubbles = new Bubbles(bus);
            });

            when(`sending the message 'request'
                """
                (!>authorize-user)(authorize-api)(:authorize-api-reply)(:authorize-user-reply)

                authorize-user: {"type":"authorize-user", "payload":{"user":"<user>"}}
                authorize-api: {"type": "authorize", "payload":{"authorizedUser":"<user>"}}
                authorize-api-reply: "<authorized-user-reply>"
                authorize-user-reply: "<authorized-user-reply>"
                """        
            `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                });

            then(`the message flow matches
        `, () => {
                    bubbles.validate();
                });
        });
});