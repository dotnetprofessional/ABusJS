import { IMessageHandlerContext } from './IMessageHandlerContext';
import { CancellationToken } from "./CancellationToken";

export class ReplyHandler {
    constructor() {

    }
    public resolve: any;
    public reject: any;
    public cancellationToken: CancellationToken;
    public context: IMessageHandlerContext;
    public timeoutToken: any;
    public hasTimedOut: boolean;
}