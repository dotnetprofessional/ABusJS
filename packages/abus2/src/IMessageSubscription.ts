import { IMessageHandler } from "./IMessageHandler";
import { ISubscriptionOptions } from "./ISubscriptionOptions";
import { IMessageHandlerContext } from './IMessageHandlerContext';

export interface IMessageSubscription<T> {
    subscriptionId: string;
    messageFilter: string;
    options: ISubscriptionOptions;
    handler: IMessageHandler<T>;
    isProcessing: boolean;
    context?: IMessageHandlerContext;
}