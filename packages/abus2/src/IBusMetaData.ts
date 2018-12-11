import { Intents } from "./Intents";
export interface IBusMetaData {
    intent?: Intents;
    messageId?: string;
    replyTo?: string;
}