import { IMessageHandler } from './IMessageHandler'

export interface IMessageSubscription<T> {
    name?: string;
    messageFilter: string | T;
    handler: IMessageHandler<T>;
}