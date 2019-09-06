import { handler, IMessageHandlerContext } from 'abus';
import { GetAgreementHeadersCommand, AgreementProcessStatusEvent, ParentCompanyHeadersEvent } from './messages';
import { GetAgreementHeadersRequest } from './services/GetAgreementHeadersRequest';
import { GetAgreementHeadersResponse } from './services/GetAgreementHeadersResponse';

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

    @handler(GetAgreementHeadersCommand)
    public async getAgreementHeaders(message: GetAgreementHeadersCommand, context: IMessageHandlerContext): Promise<void> {
        try {
            const { tpid, sortOrder, nextPageKey } = message;
            context.publishAsync(new AgreementProcessStatusEvent("GetAgreementHeadersCommand", "EXECUTING"));
            // check the cache for the request
            let apiResponse = this.getAgreementsFromCache(message);
            if (!apiResponse) {
                apiResponse = await context.sendWithReplyAsync<GetAgreementHeadersResponse>(new GetAgreementHeadersRequest(tpid, sortOrder, nextPageKey));
                if (!this.data.tpids[message.tpid]) {
                    this.data.tpids[message.tpid] = {};
                }
                // store data in cache in a very basic way
                this.data.tpids[message.tpid][apiResponse.lastPageKey] = apiResponse;
            }
            const response = new ParentCompanyHeadersEvent(apiResponse.tpid, apiResponse.lastPageKey, apiResponse.agreementHeaders);
            context.publishAsync(response);
            context.publishAsync(new AgreementProcessStatusEvent("GetAgreementHeadersCommand", "COMPLETE"));
        } catch (e) {
            context.publishAsync(new AgreementProcessStatusEvent("GetAgreementHeadersCommand", "ERROR", e.description));
        }
    }

    private getAgreementsFromCache(message: GetAgreementHeadersCommand): GetAgreementHeadersResponse {
        if (!this.data.tpids) {
            this.data.tpids = {};
        }
        const tpidCache = this.data.tpids[message.tpid];
        if (tpidCache && tpidCache[message.nextPageKey]) {
            return tpidCache[message.nextPageKey];
        }
    }
}