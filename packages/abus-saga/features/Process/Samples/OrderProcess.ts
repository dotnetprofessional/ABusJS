import { Process, IPersistDocuments, InMemoryKeyValueStore } from "../../../src";
import { handler, IMessageHandlerContext } from "abus";
import { IStorage } from '../../../src/Process';

export class ProcessOrderCommand {
    constructor(public orderId: string) { }
}

export class IOrderProcessModel {
    processedOrders: string[];
}

export class OrderProcess extends Process {
    private storage: IStorage<IOrderProcessModel>;
    public id: number;

    constructor() {
        super();
        this.id = new Date().getTime();
        // initialize data
        this.storage = this.useStorage<IOrderProcessModel>(new InMemoryKeyValueStore(), { processedOrders: [] });
    }

    @handler(ProcessOrderCommand)
    async handler(message: ProcessOrderCommand, context: IMessageHandlerContext) {
        const data = await this.storage.getValueAsync();
        data.processedOrders.push(message.orderId);

        // simulate exceptions
        if (message.orderId === "error") {
            throw Error("Something bad happened!");
        }
    }

    protected async afterHandlerAsync(context: IMessageHandlerContext) {
        await this.storage.storeAsync();
    }

}