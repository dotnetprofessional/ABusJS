import { IMessageHandlerContext } from "./IMessageHandlerContext";
import { IMessage } from "./IMessage";
import { ISendOptions } from "./ISendOptions"
import { IBus } from "./IBus";
import { IBusMetaData } from "./IBusMetaData";
import { Intents } from "./Intents";
import { Bus } from "./Bus";
import { MessageException } from "./tasks/MessageException";
import * as Exceptions from "./Exceptions";

export class MessageHandlerContext implements IMessageHandlerContext {
    public wasCancelled: boolean;

    constructor(protected bus: IBus, public parentMessage: IMessage<any>, public activeMessage: IMessage<any>) {
        this.shouldTerminatePipeline = false;
    }

    public shouldTerminatePipeline: boolean;

    public async replyAsync<T>(reply: T): Promise<void> {
        // ensure the active message has someone listening for a reply
        if (!this.activeMessageMetaData || this.activeMessageMetaData.intent !== Intents.sendReply) {
            throw new Error(`Unable to reply to a message that wasn't sent with the ${Intents.sendReply} intent`);
        }

        if (this.wasCancelled) {
            // the context for this reply was cancelled so substitute original with ane exception
            reply = new Exceptions.ReplyHandlerCancelledException("Reply not delivered due to handler being cancelled.", reply) as any;
        }

        let replyMessage: any = reply;
        if (replyMessage instanceof Error) {
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

    public publishAsync<T>(message: T | IMessage<T>, options?: ISendOptions): Promise<void> {
        if (this.wasCancelled) {
            return;
        }

        return (this.bus as Bus).publishAsync(message, options, this.activeMessage);
    }

    public sendWithReplyAsync<R>(message: any, options?: ISendOptions): Promise<R> {
        if (this.wasCancelled) {
            throw new Exceptions.HandlerCancelledException("Request not sent due to handler being cancelled.", message);
        }

        return (this.bus as Bus).sendWithReplyAsync(message, options, this.activeMessage);
    }

    public sendAsync<T>(message: T | IMessage<T>, options?: ISendOptions): Promise<void> {
        if (this.wasCancelled) {
            return;
        }

        return (this.bus as Bus).sendAsync(message, options, this.activeMessage);
    }

    private get activeMessageMetaData(): IBusMetaData {
        return this.activeMessage.metaData as IBusMetaData
    }
}