import TimeSpan from './TimeSpan'
import {QueuedMessage} from './QueuedMessage'

export interface IMessageQueue {
    clear();

    leasePeriod: TimeSpan;

    addMessageAsync(message: QueuedMessage, deliverIn?: TimeSpan);

    getMessage(): QueuedMessage;

    completeMessageAsync(messageId: string);

    abandonMessageAsync(messageId: string);

    peekMessage();

    onMessage(handler: (message: QueuedMessage) => void);

    renewLease(messageId: string, timeSpan: TimeSpan);

    count: number;
    
}