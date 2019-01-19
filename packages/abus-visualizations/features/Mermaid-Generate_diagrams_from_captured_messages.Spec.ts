import data from "./samples/get-headers-process";
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

            participant start
            participant AgreementsProcess
            participant AgreementService
            start->>AgreementsProcess:GetAgreementHeadersCommand
            AgreementsProcess->>unhandled:AgreementProcessStatusEvent
            AgreementsProcess->>AgreementService:GetAgreementHeadersRequest
            AgreementService-->>AgreementsProcess:GetAgreementHeadersRequest.reply
            AgreementsProcess->>unhandled:ParentCompanyHeadersEvent
            AgreementsProcess->>unhandled:AgreementProcessStatusEvent
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

            AgreementsProcess
            AgreementService
            start --> |GetAgreementHeadersCommand| AgreementsProcess
            AgreementsProcess --> |AgreementProcessStatusEvent| unhandled
            AgreementsProcess --> |GetAgreementHeadersRequest| AgreementService
            AgreementService -.-> |GetAgreementHeadersRequest.reply| AgreementsProcess
            AgreementsProcess --> |ParentCompanyHeadersEvent| unhandled
            AgreementsProcess --> |AgreementProcessStatusEvent| unhandled
            """
        `, () => {
                diagramResult.should.be.eq(stepContext.docString);
            });
    });
});