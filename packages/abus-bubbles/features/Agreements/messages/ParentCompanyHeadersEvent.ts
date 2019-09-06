import { AgreementHeader } from "../model/AgreementHeader";

export class ParentCompanyHeadersEvent {
    constructor(
        public tpid: string,
        public lastPageKey: string,
        public agreementHeaders: AgreementHeader[]) { }
}