import data from "./samples/get-headers-process";
import { Mermaid } from "../src/mermaid";
import "livedoc-mocha";
feature(`Mermaid: Generate sequence diagram from message flows`, () => {
    const mermaid: Mermaid = new Mermaid();

    scenario(`A simple flow with two process`, () => {
        let diagramResult: string;

        given(`the results of a message flow`, () => {

        });

        when(`executing the sequenceDiagram method`, () => {
            diagramResult = mermaid.sequenceDiagram(data);
            debugger;
        });

        then(`the follow mermaid markup is produced`, () => {

        });
    });
});