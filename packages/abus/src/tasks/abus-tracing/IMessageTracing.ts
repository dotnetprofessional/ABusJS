import { IBusMetaData } from "../../IBusMetaData";

export interface IMessageTracing extends IBusMetaData {
    conversationId: string;
    correlationId: string;
    startProcessing: number;
    endProcessing: number;
}