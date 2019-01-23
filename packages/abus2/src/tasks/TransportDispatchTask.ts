import { IMessage } from '../IMessage'
import { IMessageHandlerContext } from '../IMessageHandlerContext'
import { IMessageTask } from './IMessageTask'
import { IBusMetaData } from "../IBusMetaData";
import { Intents } from '../Intents';
import { IRegisteredTransport } from '../IRegisteredTransport';
import { ISendOptions } from '../ISendOptions';
import { TimeSpan } from '../Timespan';

export class TransportDispatchTask implements IMessageTask {
    private timeToDelay: TimeSpan;

    public constructor(protected transport: IRegisteredTransport, protected options: ISendOptions) {
        this.timeToDelay = (options && options.timeToDelay) || undefined;
    }

    public async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any): Promise<void> {
        const intent = (message.metaData as IBusMetaData).intent;

        switch (intent) {
            case Intents.publish:
                await this.transport.transport.publishAsync(message, this.timeToDelay);
                break;
            case Intents.send:
            case Intents.reply:
            case Intents.sendReply:
                await this.transport.transport.sendAsync(message, this.timeToDelay);
                break;
            default:
                throw new Error("Unknown message intent: " + intent);
        }

        // This task does not continue the pipeline by calling next as its the last task to be executed
    }

}