import { IMessage } from '../IMessage'
import { IMessageHandlerContext } from '../IMessageHandlerContext'
import { IMessageTask } from './IMessageTask'

export class DebugLoggingTask implements IMessageTask {
    constructor(private prefix: string) {

    }
    public async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any): Promise<void> {
        const metaData = message.metaData as any;
        metaData.indent = "  " + (context.parentMessage && ((context.parentMessage.metaData as any).indent || "") || "");
        console.log(`${metaData.indent}${this.prefix}START type: ${message.type} (${message.metaData.messageId})`);
        await next();
        console.log(`${metaData.indent}${this.prefix}END type: ${message.type} (${message.metaData.messageId})`);
    }
}