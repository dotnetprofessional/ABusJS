import { IMessageHandlerContext, IMessage, IBusMetaData, IMessageTask } from "../..";

export interface IMessageTracing extends IBusMetaData {
    conversationId: string;
    correlationId: string;
    startProcessing: Number;
    endProcessing: Number;
}

export class MessagePerformanceTask implements IMessageTask {
    public async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any) {
        const metaData = context.activeMessage.metaData as IMessageTracing;
        metaData.startProcessing = Date.now();
        console.log("Perf Start: " + message.type)
        await next();
        console.log("Perf End: " + message.type)

        metaData.endProcessing = Date.now();
    }
}
