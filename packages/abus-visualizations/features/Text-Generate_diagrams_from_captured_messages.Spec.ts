import { data } from "./samples/get-headers-process";
import { data as requestResponseData } from "./samples/request-response-no-parent";
import "livedoc-mocha";
import * as chai from "chai";
import { TextVisualizations } from "../src/TextVisualizations";

chai.should();

feature(`Text: Generate diagrams from captured messages`, () => {
    const text: TextVisualizations = new TextVisualizations();

    scenario(`Create an ASCII tree diagram from message flow`, () => {
        let diagramResult: string;

        given(`the results of a message flow`, () => { });

        when(`executing the sequenceDiagram method`, () => {
            diagramResult = text.tree(data);
        });

        then(`the follow ASCII tree is produced
            """
            start
            └╴ GetAgreementHeadersCommand (1ms)
               ├╴ AgreementProcessStatusEvent 
               ├╴ GetAgreementHeadersRequest (0ms)
               │  └╴ GetAgreementHeadersRequest.reply (0ms)
               ├╴ ParentCompanyHeadersEvent 
               └╴ AgreementProcessStatusEvent
            """
        `, () => {
                diagramResult.should.be.eq(stepContext.docString + " \n");
            });
    });

    scenario(`Create an ASCII tree diagram from message flow for request/response that has no parent`, () => {
        let diagramResult: string;

        given(`the results of a message flow`, () => { });

        when(`executing the sequenceDiagram method`, () => {
            diagramResult = text.tree(requestResponseData);
        });

        then(`the follow ASCII tree is produced
            """
            start
            └╴ AgreementRequest (0ms)
               ├╴ HttpRequest (0ms)
               │  └╴ HttpRequest.reply (0ms)
               └╴ AgreementRequest.reply (0ms)
            """
        `, () => {
                diagramResult.should.be.eq(stepContext.docString + "\n");
            });
    });

});