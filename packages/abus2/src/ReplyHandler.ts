import { IMessageHandlerContext } from './IMessageHandlerContext';

export class ReplyHandler {
    constructor() {

    }
    public resolve: any;
    public reject: any;
    // public replyTo: string;
    public isCancelled: boolean = false;
    public context: IMessageHandlerContext;
}