import { IMessageTask, IBus, IMessage, IMessageHandlerContext, newGuid } from 'abus';
import { messageProcessed } from './messages';

export class AbusMonitorTask implements IMessageTask {
    private instanceId: string = newGuid();

    constructor(protected bus: IBus) {

    }
    async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any): Promise<void> {
        await next();
        // Now that handlers have completed send the message to the devTools.
        const m = messageProcessed({
            instanceId: this.instanceId,
            dataStore: "ABUS",
            data: message
        })
        this.bus.publishAsync(m);
    }
}
