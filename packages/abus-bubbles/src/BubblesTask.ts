import { IMessageTask, IMessageHandlerContext } from "../../abus2/src";
import { IMessage } from "../../abus2/src/IMessage";
import { Bubbles } from './Bubbles';
export class BubblesTask implements IMessageTask {
    constructor(private bubbles: Bubbles) {
    }
    public async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any): Promise<void> {
        if (!await this.bubbles.messageHandlerAsync(message, context)) {
            await next();
        }
    }
}
