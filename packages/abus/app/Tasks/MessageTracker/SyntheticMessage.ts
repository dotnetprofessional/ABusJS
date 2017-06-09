import { IMessage } from "../../IMessage";
import { MetaData } from "../../MetaData";
import { Guid } from "../../Guid";

export class SyntheticMessage<T> implements IMessage<T> {
    message: T;
    metaData: MetaData;

    constructor(public type: string) {
        this.metaData = new MetaData();
        this.metaData.messageId = Guid.newGuid();
    }
}