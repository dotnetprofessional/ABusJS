import { IMessageTracing } from "./IMessageTracing";
import { IMessageHandlerContext, IMessageTask, IMessage, newGuid } from "../..";

export class MessageTracingTask implements IMessageTask {
    async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any): Promise<void> {
        // Add context data to message
        const metaData = context.activeMessage.metaData as IMessageTracing;
        const parentMetaData: IMessageTracing = context.parentMessage ? context.parentMessage.metaData as IMessageTracing : undefined;

        metaData.messageId = metaData.messageId || newGuid();
        metaData.conversationId = parentMetaData ? parentMetaData.conversationId : newGuid();

        // CorrelationId becomes the current message
        metaData.correlationId = metaData.correlationId || (parentMetaData ? parentMetaData.messageId : undefined);

        // the receivedBy attribute is set as the handler is receiving the message. Ideally it too would be in this task
        // but the information isn't currently available to do that.
        if (context.parentMessage && !message.metaData.sentBy) {
            metaData.sentBy = context.parentMessage.metaData.receivedBy;
        }
        await next();
    }
}