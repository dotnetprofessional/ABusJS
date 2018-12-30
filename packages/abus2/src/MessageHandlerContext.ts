import { IMessageHandlerContext } from "./IMessageHandlerContext";
import { IMessage } from "./IMessage";
import { SendOptions } from "./SendOptions"
import { IBus } from "./IBus";
import { ReplyRequest } from "./ReplyRequest";
import { IBusMetaData } from "./IBusMetaData";
import { Intents } from "./Intents";
import { Bus } from "./Bus";

export class MessageHandlerContext implements IMessageHandlerContext {
    constructor(protected bus: IBus, public parentMessage: IMessage<any>, public activeMessage: IMessage<any>) {
        this.shouldTerminatePipeline = false;
    }

    public shouldTerminatePipeline: boolean;

    public async replyAsync<T>(reply: T): Promise<void> {
        // Ensure the active message has someone listening for a reply
        if (!this.activeMessageMetaData || this.activeMessageMetaData.intent !== Intents.sendReply) {
            throw new Error(`Unable to reply to a message that wasn't sent with the ${Intents.sendReply} intent`);
        }

        var msg: IMessage<any> = { type: this.activeMessage.type + ".reply", payload: reply };
        // Need to add a replyTo so it can be delivered to the correct handler
        Bus.applyIntent(msg, Intents.reply);
        msg.metaData.replyTo = this.activeMessage.metaData.messageId;
        await (this.bus as Bus).sendAsync(msg, null, this.getNewContext(msg));
        return;
    }

    public DoNotContinueDispatchingCurrentMessageToHandlers() {
        this.shouldTerminatePipeline = true;
    }

    public publishAsync<T>(message: T | IMessage<T>): Promise<void> {
        return (this.bus as Bus).publishAsync(message, this.getNewContext(message));
    }

    public sendWithReply<T, R>(message: T, options?: SendOptions): ReplyRequest {
        return (this.bus as Bus).sendWithReply(message, options, this.getNewContext(message));
    }
    public sendAsync<T>(message: T | IMessage<T>, options?: SendOptions): Promise<void> {
        return (this.bus as Bus).sendAsync(message, options, this.getNewContext(message));
    }

    private get activeMessageMetaData(): IBusMetaData {
        return this.activeMessage.metaData as IBusMetaData
    }

    private getNewContext(message: any): IMessageHandlerContext {
        return new MessageHandlerContext(this.bus, Object.assign({}, this.activeMessage), message);
    }
}