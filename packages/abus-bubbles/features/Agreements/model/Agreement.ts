import { PurchaseOrder } from "./PurchaseOrder";
import { AgreementDiscount } from "./AgreementDiscount";
import { AgreementInfo } from "./AgreementInfo";
import { AgreementHeader } from "./AgreementHeader";

export class Agreement extends AgreementHeader {
    public info: AgreementInfo;
    public discount: AgreementDiscount;
    public purchaseOrder: PurchaseOrder;
}