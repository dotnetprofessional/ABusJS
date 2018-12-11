import { IMessageHandler } from "./IMessageHandler";

export interface IMessageSubscription<T> {
    subscriptionId: string;
    messageFilter: string;
    handler: IMessageHandler<T>;
}