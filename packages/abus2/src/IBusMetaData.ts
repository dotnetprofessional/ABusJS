import { Intents } from "./Intents";
import { TimeSpan } from "./Timespan";
export interface IBusMetaData {
    intent?: Intents;
    messageId?: string;
    replyTo?: string;
    timeToDelay?: TimeSpan | number;
    sentBy?: string;
    receivedBy?: string;
}