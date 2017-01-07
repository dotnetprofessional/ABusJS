import {MetaData} from './MetaData'

export interface IMessage<T> {
    type: string;
    message: T;
    metaData?: MetaData;
}