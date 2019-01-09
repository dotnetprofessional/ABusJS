import { IMessageHandler } from "./IMessageHandler";

export interface IMessageSubscription<T> {
    subscriptionId: string;
    messageFilter: string;
    identifier: string;
    handler: IMessageHandler<T>;
}