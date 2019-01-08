import { AgreementHeader } from "../model/AgreementHeader";

export class ParentCompanyHeadersEvent {
    public tpid: string;
    public agreementHeaders: AgreementHeader[];
}