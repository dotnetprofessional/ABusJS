import { IMessage, IMessageHandlerContext, IBusMetaData, IMessageTask, newGuid } from 'abus2';
import { IMessageTracing } from './MessagePerformanceTask';

export class MessageTracingTask implements IMessageTask {
    async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any): Promise<void> {
        // Add context data to message
        const metaData = context.activeMessage.metaData as IMessageTracing;
        const parentMetaData: IMessageTracing = context.parentMessage ? context.parentMessage.metaData as IMessageTracing : undefined;

        metaData.messageId = newGuid();
        metaData.conversationId = parentMetaData ? parentMetaData.conversationId : newGuid();

        // CorrelationId becomes the current message
        metaData.correlationId = parentMetaData ? parentMetaData.messageId : undefined;

        await next();
    }
}