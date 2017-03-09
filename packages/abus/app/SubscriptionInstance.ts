import { IMessageSubscription } from './IMessageSubscription'
import { MessageHandlerOptions } from './MessageHandlerOptions'

// Internal interface to track instances of subscriptions
export class SubscriptionInstance {
    public name: string;
    public messageSubscription: IMessageSubscription<any>;
    public options: MessageHandlerOptions;
}