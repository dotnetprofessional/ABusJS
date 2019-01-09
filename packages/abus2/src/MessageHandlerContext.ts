import { IMessageHandlerContext } from "./IMessageHandlerContext";
import { IMessage } from "./IMessage";
import { SendOptions } from "./SendOptions"
import { IBus } from "./IBus";
import { ReplyRequest } from "./ReplyRequest";
import { IBusMetaData } from "./IBusMetaData";
import { Intents } from "./Intents";
import { Bus } from "./Bus";
import { MessageException } from "./tasks/MessageException";

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

        let replyMessage: any = reply;
        if (typeof replyMessage === "object" && replyMessage.name === "Error") {
            // upgrade to an exception message
            const error = replyMessage as Error;
            replyMessage = new MessageException(error.message, (reply as unknown) as Error);
        }
        var msg: IMessage<any> = { type: this.activeMessage.type + ".reply", payload: replyMessage };
        // Need to add a replyTo so it can be delivered to the correct handler
        Bus.applyIntent(msg, Intents.reply);
        msg.metaData.replyTo = this.activeMessage.metaData.messageId;
        await (this.bus as Bus).sendAsync(msg, null, this.activeMessage);
        return;
    }

    public DoNotContinueDispatchingCurrentMessageToHandlers() {
        this.shouldTerminatePipeline = true;
    }

    public publishAsync<T>(message: T | IMessage<T>, options?: SendOptions): Promise<void> {
        return (this.bus as Bus).publishAsync(message, options, this.activeMessage);
    }

    public sendWithReply<T, R>(message: T, options?: SendOptions): ReplyRequest {
        return (this.bus as Bus).sendWithReply(message, options, this.activeMessage);
    }
    public sendAsync<T>(message: T | IMessage<T>, options?: SendOptions): Promise<void> {
        return (this.bus as Bus).sendAsync(message, options, this.activeMessage);
    }

    private get activeMessageMetaData(): IBusMetaData {
        return this.activeMessage.metaData as IBusMetaData
    }

    // private getNewContext(message: any): IMessageHandlerContext {
    //     return new MessageHandlerContext(this.bus, Object.assign({}, this.activeMessage), message);
    // }
}