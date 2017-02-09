import { IMessage } from '../IMessage'
import { IMessageHandlerContext } from '../IMessageHandlerContext'

export interface IMessageTask {
    invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next): Promise<void>;
}
