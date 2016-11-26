import { IMessage, MessageHandlerContext, Guid } from './ABus'
import Hashtable from './hashtable';

export interface IMessageTask {
    invoke(message: IMessage<any>, context: MessageHandlerContext, next): void;
}

export class MessageExceptionTask implements IMessageTask {
    invoke(message: IMessage<any>, context: MessageHandlerContext, next: any) {
        try {
            next();
        } catch (error) {
            message.metaData = context.metaData;
            context.publish({ type: MessageException.typeName, message: new MessageException(error, message) });
        }
    }
}

export class MessageException<T> {
    readonly errorKey = "ABus.Error";
    readonly errorCount = "ABus.Error.Count";

    constructor(public error: string, public message: IMessage<T>) {
        // Add the error to the message and update the error count
        message.metaData.update(this.errorKey, error);
        var count = message.metaData.item(this.errorCount);
        message.metaData.update(this.errorCount, count ? (count + 1).toString() : "1");
    }

    // [GM]: See if we can use species to get child class
    name: string = MessageException.typeName;

    public static typeName = "ABus.MessageException";
}

export class UnhandledMessageException<T> extends MessageException<T> {
    constructor(public error: string, public message: IMessage<T>) {
        super(error, message);
    }

    public description: string = "Unhandled exception";
}
