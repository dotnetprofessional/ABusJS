import { MessageException } from './MessageException';
import { IMessage } from '../IMessage';

export class UnhandledMessageException<T> extends MessageException<T> {
    constructor(public error: string, public message: IMessage<T>) {
        super(error, message);
    }

    public description: string = "Unhandled exception";
}