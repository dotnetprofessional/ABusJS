import { Process, IPersistDocuments } from "../../../src";
import { handler, IMessageHandlerContext } from "abus2";

export class ProcessOrderCommand {
    constructor(public orderId: string) { }
}

export class IOrderProcessModel {
    processedOrders: string[];
}

export class OrderProcess extends Process<IOrderProcessModel> {
    constructor(storage?: IPersistDocuments<IOrderProcessModel>) {
        super(storage);
        // initialize data
        this.data.processedOrders = [];
    }

    @handler(ProcessOrderCommand)
    async handler(message: ProcessOrderCommand, context: IMessageHandlerContext) {
        this.data.processedOrders.push(message.orderId);

        // simulate exceptions
        if (message.orderId === "error") {
            throw Error("Something bad happened!");
        }
    }

}