import { IMessageHandlerContext, handler } from "../../../../src";
import { GetAgreementHeadersRequest } from "./GetAgreementHeadersRequest";
import { AgreementHeader } from "../model/AgreementHeader";
import { GetAgreementHeadersResponse } from "./GetAgreementHeadersResponse";

export class AgreementService {
    private testData = {
        "12345": [
            { id: "1", tpid: "12345", name: "Agreement 1", discount: { discount: 10 }, info: { name: "Agreement 1" }, purchaseOrder: { id: "890" } },
            { id: "2", tpid: "12345", name: "Agreement 2", discount: { discount: 2 }, info: { name: "Agreement 2" }, purchaseOrder: { id: "891" } },
            { id: "3", tpid: "12345", name: "Agreement 3", discount: { discount: 0 }, info: { name: "Agreement 3" }, purchaseOrder: { id: "892" } },
            { id: "4", tpid: "12345", name: "Agreement 4", discount: { discount: 3 }, info: { name: "Agreement 4" }, purchaseOrder: { id: "893" } },
            { id: "5", tpid: "12345", name: "Agreement 5", discount: { discount: 6 }, info: { name: "Agreement 5" }, purchaseOrder: { id: "894" } }
        ],
        "12346": [
            { id: "6", tpid: "12346", name: "Agreement 6", discount: { discount: 9 }, info: { name: "Agreement 6" }, purchaseOrder: { id: "895" } },
            { id: "7", tpid: "12346", name: "Agreement 7", discount: { discount: 3 }, info: { name: "Agreement 7" }, purchaseOrder: { id: "896" } },
            { id: "8", tpid: "12346", name: "Agreement 8", discount: { discount: 2 }, info: { name: "Agreement 8" }, purchaseOrder: { id: "897" } },
            { id: "9", tpid: "12346", name: "Agreement 9", discount: { discount: 1 }, info: { name: "Agreement 9" }, purchaseOrder: { id: "898" } },
            { id: "10", tpid: "12346", name: "Agreement 10", discount: { discount: 0 }, info: { name: "Agreement 10" }, purchaseOrder: { id: "899" } }
        ]
    };

    @handler(GetAgreementHeadersRequest)
    public async getAgreementHeaders(message: GetAgreementHeadersRequest, context: IMessageHandlerContext): Promise<void> {
        // pages are kept really small to make testing easier :)
        debugger;
        // find tpid data
        const agreements = this.testData[message.tpid];
        if (!agreements) {
            context.replyAsync(new Error(`Unable to locate tpid: ${message.tpid}`));
            return;
        }

        const fromIndex = Number(message.nextPageKey) || 0;
        const pageCount = 2;
        const toIndex = fromIndex + pageCount;
        let foundAgreements: AgreementHeader[] = [];
        for (let index = 0; index < agreements.length; index++) {
            const agreement = agreements[index];
            if (agreement.tpid === message.tpid && index >= fromIndex && index < toIndex) {
                foundAgreements.push({ id: agreement.id, name: agreement.name, tpid: agreement.tpid });
            }
        }
        const result: GetAgreementHeadersResponse = { tpid: message.tpid, agreementHeaders: foundAgreements, lastPageKey: (toIndex + 1).toString() };
        // send result back to caller
        context.replyAsync(result);
    }
}