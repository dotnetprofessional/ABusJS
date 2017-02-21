import { IMessage } from '../IMessage'

export class MessageException<T> {
    readonly errorKey = "Bus.Error";
    readonly errorCount = "Bus.Error.Count";

    constructor(public error: string, public message: IMessage<T>) {
        // Add the error to the message and update the error count
        message.metaData.update(this.errorKey, error);
        var count = message.metaData.item(this.errorCount);
        message.metaData.update(this.errorCount, count ? (count + 1).toString() : "1");
    }

    // [GM]: See if we can use species to get child class
    public name: string = MessageException.typeName;

    public static typeName = "Bus.MessageException";
}