import { IMessage } from '../IMessage'
import { IMessageHandlerContext } from '../IMessageHandlerContext'
import { IMessageTask } from './IMessageTask'
import { IBusMetaData } from "../IBusMetaData";
import { Intents } from '../Intents';
import { IRegisteredTransport } from '../IRegisteredTransport';
import { SendOptions } from '../SendOptions';

export class TransportDispatchTask implements IMessageTask {
    public constructor(protected transport: IRegisteredTransport, protected options: SendOptions) { }

    public async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any): Promise<void> {
        const intent = (message.metaData as IBusMetaData).intent;

        switch (intent) {
            case Intents.publish:
                await this.transport.transport.publishAsync(message, message.metaData.timeToDelay);
                break;
            case Intents.send:
            case Intents.reply:
            case Intents.sendReply:
                await this.transport.transport.sendAsync(message, message.metaData.timeToDelay);
                break;
            default:
                throw new Error("Unknown message intent: " + intent);
        }

        // This task does not continue the pipeline by calling next as its the last task to be executed
    }

}