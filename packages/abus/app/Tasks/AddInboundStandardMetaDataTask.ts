import { IMessage } from '../IMessage'
import { MessageHandlerContext } from '../MessageHandlerContext'
import { IMessageTask } from './IMessageTask'

export class AddInboundStandardMetaDataTask implements IMessageTask {
    public async invokeAsync(message: IMessage<any>, context: MessageHandlerContext, next: any) {
        message.metaData.startProcessing = Date.now();

        await next();

        // tslint:disable-next-line:no-debugger
        message.metaData.endProcessing = Date.now();
    }
}
