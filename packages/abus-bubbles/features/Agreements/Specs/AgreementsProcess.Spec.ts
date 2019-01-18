import { Bubbles } from "../../../src";
import { AgreementsProcess } from "../AgreementsProcess";
import { AgreementService } from "../services/AgreementService";

feature.only(`Agreements Process`, () => {
    let bubbles: Bubbles;

    background(``, () => {
        given(`all handlers have been registered`, () => {
            bubbles = new Bubbles();
            bubbles.bus.registerHandlers(AgreementsProcess);
            bubbles.bus.registerHandlers(AgreementService);

        });
    });

    scenario(`Retrieve agreement headers for TPID`, () => {
        when(`requesting the agreement headers the following flow occurs
            """
            (request-headers)(*status-executing)(>api-request)(:api-response)(*request-headers-event)(*status-complete)
        
            request-headers: {"type":"GetAgreementHeadersCommand", "payload": {"tpid": "12345"}}
            api-request: {"type":"GetAgreementHeadersRequest", "payload": {"tpid": "12345"}}
            api-response: {"tpid": "12345", "agreementHeaders": [{"id":"1"},{"id":"2"}]}
            request-headers-event: {"type":"ParentCompanyHeadersEvent", "payload": {"tpid": "12345", "agreementHeaders": [{"id":"1"},{"id":"2"}]}}
            status-executing: {"type":"AgreementProcessStatusEvent", "payload": {"operation": "GetAgreementHeadersCommand", "status": "EXECUTING"}}
            status-complete: {"type":"AgreementProcessStatusEvent", "payload": {"operation": "GetAgreementHeadersCommand", "status": "COMPLETE"}}
            """
            `, async () => {
                await bubbles.executeAsync(stepContext.docString);
                debugger;
            });

        then(`the headers are returned for the tpid`, () => {
            bubbles.validate();
        });
    });

    scenario(`Retrieve agreement headers for TPID that doesn't exist`, () => {
        when(`requesting the agreement headers the following flow occurs
            """
            (request-headers)(*status-executing)(>api-request)(!:api-response)(*status-error)
        
            request-headers: {"type":"GetAgreementHeadersCommand", "payload": {"tpid": "XXX"}}
            status-executing: {"type":"AgreementProcessStatusEvent", "payload": {"operation": "GetAgreementHeadersCommand", "status": "EXECUTING"}}
            api-request: {"type":"GetAgreementHeadersRequest", "payload": {"tpid": "XXX"}}
            api-response: {"error":"Unable to locate tpid: XXXX-from test!!"}
            status-error: {"type":"AgreementProcessStatusEvent", "payload": {"operation": "GetAgreementHeadersCommand", "status": "ERROR"}}
            """
            `, async () => {
                await bubbles.executeAsync(stepContext.docString);
                debugger;
            });

        then(`an exception is returned via a status update`, () => {
            bubbles.validate();
        });
    });
});