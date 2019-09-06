import { IBus, Bus, MessageException } from "abus";
import { GetAgreementHeadersResponse } from "../services/GetAgreementHeadersResponse";
import { AgreementService } from "../services/AgreementService";
import { GetAgreementHeadersRequest } from "../services/GetAgreementHeadersRequest";
import { Bubbles } from "../../../src";

feature(`Agreements Service`, () => {
    let bus: IBus;
    background(``, () => {
        given(`bus initialized`, () => {
            bus = new Bus();
            bus.start();
        });
    });
    scenario(`Retrieve agreements for existing TPID from AgreementsService`, () => {
        let agreements: GetAgreementHeadersResponse;

        given(`AgreementService is running`, () => {
            bus.registerHandlers(AgreementService);
        });

        when(`requesting the agreements for TPID: '12345'`, async () => {
            agreements = await bus.sendWithReplyAsync<GetAgreementHeadersResponse>(new GetAgreementHeadersRequest(stepContext.valuesRaw[0]));
        });

        then(`there are '2' records returned`, () => {
            agreements.agreementHeaders.length.should.be.eq(stepContext.values[0]);
        });
    });

    scenario(`Retrieve agreements for non-existent TPID from AgreementsService`, () => {
        let exception: MessageException;

        given(`AgreementService is running`, () => {
            bus.registerHandlers(AgreementService);
        });

        when(`requesting the agreements for TPID: 'XXXX'`, async () => {
            try {
                await bus.sendWithReplyAsync<GetAgreementHeadersResponse>(new GetAgreementHeadersRequest(stepContext.valuesRaw[0]));
            } catch (e) {
                exception = e;
            }
        });

        then(`an exception with the following error is thrown
            """
            Unable to locate tpid: XXXX
            """
            `, () => {
                exception.message.should.be.eq(stepContext.docString);
            });
    });

    scenario(`Alternative#1: Retrieve agreements for existing TPID from AgreementsService

        * This example shows that the more complex response can be supplied directly in the definition
        `, () => {
            let bubbles: Bubbles;

            given(`AgreementService is running`, () => {
                bus.registerHandlers(AgreementService);
                bubbles = new Bubbles(bus);
            });

            when(`requesting the agreements for TPID: '12345'
            """
            (!>request)(@response)

            request: {"type": "GetAgreementHeadersRequest", "payload": {"tpid": "12345"} }
            response:  {"tpid":"12345","agreementHeaders":[{"id":"1","name":"Agreement 1","tpid":"12345"},{"id":"2","name":"Agreement 2","tpid":"12345"}]}
            """
            `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                });

            then(`an exception is thrown`, () => {
                bubbles.validate();
            });
        });

    scenario(`Alternative#2: Retrieve agreements for existing TPID from AgreementsService`, () => {
        let bubbles: Bubbles;
        let response = { "tpid": "12345", "id": null, "agreementHeaders": [{ "id": "1", "name": "Agreement 1", "tpid": "12345" }, { "id": "2", "name": "Agreement 2", "tpid": "12345" }] }

        given(`AgreementService is running`, () => {
            bus.registerHandlers(AgreementService);
            bubbles = new Bubbles(bus);
        });

        when(`requesting the agreements for TPID: '12345

            * This example shows that the more complex response can be supplied via code
            '
            """
            (!>request)(@response)

            request: {"type": "GetAgreementHeadersRequest", "payload": {"tpid": "12345"} }
            """
            `, async () => {
                await bubbles.executeAsync(stepContext.docString, [{ name: "response", message: response }]);
            });

        then(`an exception is thrown`, () => {
            bubbles.validate();
        });
    });

    scenario(`Alternative: Retrieve agreements for non-existent TPID from AgreementsService

        * This sample uses the Bubbles library to validate the flow
        `, () => {
            let bubbles: Bubbles;

            given(`AgreementService is running`, () => {
                bus.registerHandlers(AgreementService);
                bubbles = new Bubbles(bus);
            });

            when(`requesting the agreements for TPID: 'XXXX'
            """
            (!>request)(error)

            request: {"type": "GetAgreementHeadersRequest", "payload": {"tpid": "XXXX"} }
            error:  {"error":"Unable to locate tpid: XXXX"}
            """
            `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                });

            then(`an exception is thrown`, () => {
                bubbles.validate();
            });
        });
});