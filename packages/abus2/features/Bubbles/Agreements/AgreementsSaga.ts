import { IMessageHandlerContext, handler } from "../../../src";
import { ChangeActiveParentCompanyCommand, ParentCompanyHeadersEvent, GetAgreementHeadersCommand } from "./messages";
import { GetAgreementHeadersResponse } from "./services/GetAgreementHeadersResponse";
import { GetAgreementHeadersRequest } from "./services/GetAgreementHeadersRequest";
import { AgreementHeader } from "./model/AgreementHeader";


export class AgreementProcessData {
    activeTpid: string;
    tpids: {}; // add typing
}

export interface IAgreementsSagaKey {
    tpid: string;
}
export class GetAgreementsCommand implements IAgreementsSagaKey {
    tpid: string;
    sortOrder?: string;
    nextPageKey?: string;
}

export class AgreementsProcess {
    private data: AgreementProcessData = new AgreementProcessData();

    @handler(ChangeActiveParentCompanyCommand)
    public async changeActiveParentCompany(message: ChangeActiveParentCompanyCommand, context: IMessageHandlerContext) {

    }

    @handler(GetAgreementHeadersCommand)
    public async getAgreementHeaders(message: GetAgreementHeadersCommand, context: IMessageHandlerContext) {
        try {
            const { tpid, sortOrder, nextPageKey } = message;

            // check the cache for the request
            let apiResponse = this.getAgreementsFromCache(message);
            if (!apiResponse) {
                apiResponse = await context.sendWithReply(new GetAgreementHeadersRequest(tpid, sortOrder, nextPageKey))
                    .responseAsync<GetAgreementHeadersResponse>();

                if (!this.data.tpids[message.tpid]) {
                    this.data.tpids[message.tpid] = {};
                }
                // store data in cache in a very basic way
                this.data.tpids[message.tpid][apiResponse.lastPageKey] = apiResponse;
            }
            const response = new ParentCompanyHeadersEvent(apiResponse.tpid, apiResponse.lastPageKey, apiResponse.agreementHeaders);
            context.publishAsync(response);
        } catch (e) {
            context.replyAsync(e);
        }
    }

    private getAgreementsFromCache(message: GetAgreementHeadersCommand): GetAgreementHeadersResponse {
        const tpidCache = this.data.tpids[message.tpid];
        if (tpidCache && tpidCache[message.nextPageKey]) {
            return tpidCache[message.nextPageKey];
        }
    }
}