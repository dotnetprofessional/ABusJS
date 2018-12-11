import { ReplyHandler } from "./ReplyHandler";

export class ReplyRequest {
    constructor(private handler: ReplyHandler, private handlerPromise: Promise<any>) {

    }

    public cancel(): void {
        this.handler.isCancelled = true;
    }

    public responseAsync<R>(): Promise<R> {
        return this.handlerPromise;
    }
}