import { IMessage } from '../IMessage'
import { MessageHandlerContext } from '../MessageHandlerContext'
import { IMessageTask } from './MessageTasks'
import { Guid } from '../Guid'

export class AddStandardMetaDataTask implements IMessageTask {
    invoke(message: IMessage<any>, context: MessageHandlerContext, next: any) {
        // Add context data to message
        if (!context.metaData.conversationId) {
            message.metaData.conversationId = Guid.newGuid();
        } else {
            message.metaData.conversationId = context.metaData.conversationId;
        }

        // CorrelationId becomes the current messa
        message.metaData.correlationId = context.messageId;
        message.metaData.messageType = message.type;

        next();
    }
}
