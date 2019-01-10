import { IMessageHandler } from "./IMessageHandler";
import { ISubscriptionOptions } from "./ISubscriptionOptions";

export interface IMessageSubscription<T> {
    subscriptionId: string;
    messageFilter: string;
    options: ISubscriptionOptions;
    handler: IMessageHandler<T>;
}