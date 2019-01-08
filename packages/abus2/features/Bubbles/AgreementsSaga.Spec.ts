import { GetAgreementHeadersResponse } from "./Agreements/services/GetAgreementHeadersResponse";
import { IBus, Bus } from "../../src";
import { AgreementService } from "./Agreements/services/AgreementService";
import { GetAgreementHeadersRequest } from "./Agreements/services/GetAgreementHeadersRequest";

feature.only(`Agreements Saga`, () => {
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
            agreements = await bus.sendWithReply(new GetAgreementHeadersRequest(stepContext.valuesRaw[0]))
                .responseAsync<GetAgreementHeadersResponse>();
        });

        then(`there there are '2' records returned`, () => {
            agreements.agreementHeaders.length.should.be.eq(stepContext.values[0]);
        });
    });
});