import { IMessageTask, IMessageHandlerContext } from "../../abus/src";
import { IMessage } from "../../abus/src/IMessage";
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
