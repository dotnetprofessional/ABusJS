import { IMessage } from '../IMessage'
import { IMessageHandlerContext } from '../IMessageHandlerContext'
import { IMessageTask } from './IMessageTask'
import { IMessageHandler } from '../IMessageHandler';

export class ExecuteHandlerTask implements IMessageTask {

    public constructor(protected handler: IMessageHandler<any>) {
    }

    public async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any): Promise<void> {
        await this.handler(message.payload, context);

        // This task does not continue the pipeline by calling next as its the last task to be executed
    }
}