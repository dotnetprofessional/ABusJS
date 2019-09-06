import { data } from "./samples/get-headers-process";
import { data as requestResponseData } from "./samples/request-response-no-parent";
import { Mermaid } from "../src/Mermaid";
import "livedoc-mocha";
import * as chai from "chai";

chai.should();

feature(`Mermaid: Generate diagrams from captured messages`, () => {
    const mermaid: Mermaid = new Mermaid();

    scenario(`Create a sequence diagram from message flow`, () => {
        let diagramResult: string;

        given(`the results of a message flow`, () => {

        });

        when(`executing the sequenceDiagram method`, () => {
            diagramResult = mermaid.sequenceDiagram(data);
        });

        then(`the follow mermaid markup is produced
            """
            sequenceDiagram

            participant Bubbles
            participant AgreementsProcess
            participant AgreementService
            Bubbles->>AgreementsProcess:GetAgreementHeadersCommand
            AgreementsProcess->>Bubbles:AgreementProcessStatusEvent
            AgreementsProcess->>AgreementService:GetAgreementHeadersRequest
            AgreementService-->>AgreementsProcess:GetAgreementHeadersRequest.reply
            AgreementsProcess->>Bubbles:ParentCompanyHeadersEvent
            AgreementsProcess->>Bubbles:AgreementProcessStatusEvent
            """
        `, () => {
                diagramResult.should.be.eq(stepContext.docString);
            });
    });

    scenario(`Create a sequence diagram from message flow for request/response that has no parent`, () => {
        let diagramResult: string;

        given(`the results of a message flow`, () => {

        });

        when(`executing the sequenceDiagram method`, () => {
            diagramResult = mermaid.sequenceDiagram(requestResponseData);
        });

        then(`the follow mermaid markup is produced
            """
            sequenceDiagram

            participant Bubbles
            participant AgreementService
            participant HttpService
            Bubbles->>AgreementService:AgreementRequest
            AgreementService->>HttpService:HttpRequest
            HttpService-->>AgreementService:HttpRequest.reply
            AgreementService-->>Bubbles:AgreementRequest.reply
            """
        `, () => {
                diagramResult.should.be.eq(stepContext.docString);
            });
    });

    scenario(`Create a process diagram from message flow`, () => {
        let diagramResult: string;

        given(`the results of a message flow`, () => {

        });

        when(`executing the sequenceDiagram method`, () => {
            diagramResult = mermaid.processFlowDiagram(data);
        });

        then(`the follow mermaid markup is produced
            """
            graph TD

            Bubbles
            AgreementsProcess
            AgreementService
            Start --> |GetAgreementHeadersCommand| AgreementsProcess
            AgreementsProcess --> |AgreementProcessStatusEvent| Bubbles
            AgreementsProcess --> |GetAgreementHeadersRequest| AgreementService
            AgreementService -.-> |GetAgreementHeadersRequest.reply| AgreementsProcess
            AgreementsProcess --> |ParentCompanyHeadersEvent| Bubbles
            AgreementsProcess --> |AgreementProcessStatusEvent| Bubbles
            """
        `, () => {
                diagramResult.should.be.eq(stepContext.docString);
            });
    });

    scenario(`Create a process diagram from message flow for request/response that has no parent`, () => {
        let diagramResult: string;

        given(`the results of a message flow`, () => {

        });

        when(`executing the sequenceDiagram method`, () => {
            diagramResult = mermaid.processFlowDiagram(requestResponseData);
        });

        then(`the follow mermaid markup is produced
            """
            graph TD

            Bubbles
            AgreementService
            HttpService
            Start --> |AgreementRequest| AgreementService
            AgreementService --> |HttpRequest| HttpService
            HttpService -.-> |HttpRequest.reply| AgreementService
            AgreementService -.-> |AgreementRequest.reply| Bubbles
            """
        `, () => {
                diagramResult.should.be.eq(stepContext.docString);
            });
    });
});