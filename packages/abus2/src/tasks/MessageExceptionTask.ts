import { IMessage } from '../IMessage'
import { IMessageHandlerContext } from '../IMessageHandlerContext'
import { IMessageTask } from './IMessageTask'
import { MessageException } from './MessageException';

export class MessageExceptionTask implements IMessageTask {
    readonly errorKey = "Bus.Error";
    readonly errorCount = "Bus.Error.Count";

    public async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any): Promise<void> {
        try {
            await next();
        } catch (error) {
            message.metaData = message.metaData || {};
            message.metaData[this.errorKey] = error;
            message.metaData[this.errorCount] = (message.metaData[this.errorCount] || 0) + 1;
            context.publishAsync({ type: MessageException.type, payload: new MessageException(error.message, message) });
        }
    }
}