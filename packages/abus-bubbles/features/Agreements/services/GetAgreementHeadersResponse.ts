import { AgreementHeader } from "../model/AgreementHeader";
export class GetAgreementHeadersResponse {
    public tpid: string;
    public id: string;
    public agreementHeaders: AgreementHeader[];
    public lastPageKey: string;
}