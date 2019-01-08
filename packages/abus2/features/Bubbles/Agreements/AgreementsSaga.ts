import { Saga } from "../../../src/sagas/saga";
import { IMessage } from "../../../src";
import { Agreement } from "../Agreement";

export class AgreementSagaData {
    agreements: Agreement[] = [];
    activeAgreementId: string;
}

export interface IAgreementsSagaKey {
    tpid: string;
}
export class GetAgreementsCommand implements IAgreementsSagaKey {
    tpid: string;
}

export class AgreementsSaga extends Saga<AgreementSagaData> {
    constructor() {
        super();
        this.sagaStartedWith("GetAgreementsCommand");
    }

    public configureSagaKey(message: IMessage<IAgreementsSagaKey>): string {
        switch (message.type) {
            case GetAgreementsCommand.name:
                return message.payload.tpid;
                break;
            default:
                throw Error("Unable to locate Saga Key for: " + message.type);
        }
    }

}