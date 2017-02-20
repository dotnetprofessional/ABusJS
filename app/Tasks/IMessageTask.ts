import { IMessage } from '../IMessage'
import { MessageHandlerContext } from '../MessageHandlerContext'

export interface IMessageTask {
    invokeAsync(message: IMessage<any>, context: MessageHandlerContext, next): Promise<void>;
}
