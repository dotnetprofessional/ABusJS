import { IMessage } from '../IMessage'
import { MessageHandlerContext } from '../MessageHandlerContext'
import { IMessageTask } from './MessageTasks'
import { Guid } from '../Guid'

export class AddStandardMetaDataTask implements IMessageTask {
    invoke(message: IMessage<any>, context: MessageHandlerContext, next: any) {
        // Add context data to message
        if (!context.metaData.conversationId) {
            context.metaData.conversationId = Guid.newGuid();
        }

        // CorrelationId becomes the current messa
        context.metaData.correlationId = context.messageId;
        context.metaData.messageId = Guid.newGuid();
        context.metaData.messageType = message.type;

        next();
    }
}
