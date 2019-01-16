import { IMessageTask } from "../IMessageTask";
import { IMessage } from "../../IMessage";
import { IMessageTracing } from "./IMessageTracing";
import { IMessageHandlerContext } from "../../IMessageHandlerContext";

export class MessagePerformanceTask implements IMessageTask {
    public async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any) {
        const metaData: IMessageTracing = context.activeMessage.metaData as IMessageTracing;
        metaData.startProcessing = Date.now();
        console.log("Perf Start: " + message.type);
        await next();
        console.log("Perf End: " + message.type);

        metaData.endProcessing = Date.now();
    }
}
