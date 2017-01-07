import TimeSpan from './TimeSpan'
import Hashtable from './Hashtable'
import {QueuedMessage} from './QueuedMessage'

export interface IMessageQueue {
    clear();

    leasePeriod: TimeSpan;

    addMessageAsync(message: QueuedMessage, deliverIn?: TimeSpan);

    getMessageAsync(): QueuedMessage;

    completeMessageAsync(messageId: string);

    abandonMessageAsync(messageId: string);

    peekMessage();

    onMessage(handler: (message: QueuedMessage) => void);

    renewLeaseAsync(messageId: string, timeSpan: TimeSpan);

    getCount(): number;
    
}