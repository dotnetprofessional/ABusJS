import {IMessageSubscription} from './IMessageSubscription'
import {MessageHandlerOptions} from './MessageHandlerOptions'

// Internal interface to track instances of subscriptions
export class SubscriptionInstance {
    name: string;
    messageSubscription: IMessageSubscription<any>;
    options: MessageHandlerOptions;
}