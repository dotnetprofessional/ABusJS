import { IBusMetaData } from "./IBusMetaData";

export interface IMessage<T> {
    type: string;
    metaData?: IBusMetaData;
    payload?: T;
}