export class GetAgreementHeadersRequest {
    constructor(public tpid: string,
        public sortOrder?: string,
        public nextPageKey?: string) {

    }
}