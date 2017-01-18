import { IMessageTask } from './IMessageTask'
import { IMessage } from '../IMessage'
import { IMessageHandlerContext } from '../IMessageHandlerContext'
import { MessageException } from './MessageException'

export class MessageExceptionTask implements IMessageTask {
    async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any) :Promise<void> {
        try {
            await next();
        } catch (error) {
            message.metaData = context.metaData;
            context.publish({ type: MessageException.typeName, message: new MessageException(error, message) });
        }
    }
}