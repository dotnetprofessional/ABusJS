import data from "./samples/get-headers-process";
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
            ├╴ GetAgreementHeadersCommand
            │  ├╴ AgreementProcessStatusEvent
            │  ├╴ GetAgreementHeadersRequest
            │  ├╴ ParentCompanyHeadersEvent
            │  └╴ AgreementProcessStatusEvent
            └╴ GetAgreementHeadersRequest.reply
            """
        `, () => {
                diagramResult.should.be.eq(stepContext.docString + "\n");
            });
    });

});