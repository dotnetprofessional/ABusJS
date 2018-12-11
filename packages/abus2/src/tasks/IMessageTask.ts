import { IMessage } from '../IMessage'
import { IMessageHandlerContext } from '../IMessageHandlerContext';

export interface IMessageTask {
    // might be better to have a pipelinecontext with just metadata and handlerContext: IMessageHandlerContext
    // like the c# version need to pass or have access to a lot of meta-data if tasks are to do the heavy lifting
    invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next): Promise<void>;
}
