import { Process } from "./Process";
import { identifier, handler, IMessageHandlerContext } from "abus2";

@identifier("PROCESS-ORDER")
export ProcessOrderCommand {
    orderId: string;
}

export OrderProcess extends Process {
    @handler(ProcessOrderCommand)
    handler(message: ProcessOrderCommand, context: IMessageHandlerContext) {

    }

}