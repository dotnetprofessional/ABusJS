import { IMessage } from "../IMessage";
import { IMessageHandlerContext } from "../IMessageHandlerContext";
import { IMessageTask } from "./IMessageTask";
import { IMessageSubscription } from "../IMessageSubscription";

/**
 * This task tracks the completion of handlers. This is required to support the cancellation policies
 *
 * @export
 * @class AutoCancellationTask
 * @implements {IMessageTask}
 */
export class AutoCancellationTask implements IMessageTask {
    readonly errorKey = "Bus.Error";
    readonly errorCount = "Bus.Error.Count";

    constructor(private subscription: IMessageSubscription<any>) {

    }
    public async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any): Promise<void> {
        try {
            this.subscription.isProcessing = true;
            await next();
        } finally {
            // only mark the subscription as complete if it hasn't been cancelled. If it has it means
            // another instance of this handler is running which will mark it as done.
            if (!context.wasCancelled) {
                this.subscription.isProcessing = false;
            }
        }
    }
}