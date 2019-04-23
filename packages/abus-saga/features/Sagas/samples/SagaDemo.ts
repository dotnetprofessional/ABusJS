import { IMessage, handler, IMessageHandlerContext } from 'abus2';
import { Saga } from '../../../src';

export class SagaDemo extends Saga<any> {

    constructor() {
        super();
        this.sagaStartedWith("START_SAGA");
    }

    public configureSagaKey(message: IMessage<any>): string {
        return message.payload.id;
    }

    @handler("START_SAGA")
    public startSaga(message: any, context: IMessageHandlerContext) {
        // console.log("HANDLER: START_SAGA");
        context.publishAsync({ type: "SAGA_STARTED" });
    }

    @handler("PROCESS_ORDER")
    public processOrder(message: any, context: IMessageHandlerContext) {
    }

    @handler("CANCEL_ORDER")
    public async cancelOrder(message: any, context: IMessageHandlerContext) {
        await this.completeAsync();
    }

    public sagaNotFound(message: IMessage<any>, context: IMessageHandlerContext) {
        // console.log("saga not found for type: " + context.activeMessage.type);
        super.sagaNotFound(message, context);
    }
}