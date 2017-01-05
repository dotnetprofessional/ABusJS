import TimeSpan from './TimeSpan'
import Hashtable from './Hashtable'
import {Message} from './Message'

export interface IMessageQueue {
    clear();

    leasePeriod: TimeSpan;

    addMessageAsync(message: Message, deliverIn?: TimeSpan);

    getMessageAsync(): Message;

    completeMessageAsync(messageId: string);

    abandonMessageAsync(messageId: string);

    peekMessage();

    onMessage(handler: (message: Message) => void);

    renewLeaseAsync(messageId: string, timeSpan: TimeSpan);

    getCount(): number;
    
}