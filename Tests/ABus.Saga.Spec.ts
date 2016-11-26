import { Saga } from '../Saga'
import { Bus, MessageHandlerContext, Message, Guid, Utils } from '../ABus'
import Log from './Logging'

import * as testData from './ABus.Sample.Messages'

// Define messages for the Saga
class StartOrder {
    orderId: string;
}

class CancelOrder extends StartOrder {

}

class CompleteOrder extends StartOrder {

}

class PaymentRequest {
    paymentRequestId: string;
}

class StartOrderCommand extends Message<StartOrder> {
    static TYPE = 'Sample.StartOrder.Command';

    constructor(orderId: string) {
        super()
        this.message = new StartOrder();
        this.message.orderId = orderId;
        this.type = StartOrderCommand.TYPE;
    }
}

class PaymentTransactionCompleted {
    paymentTransactionId: string;
}

class PaymentTransactionCompletedCommand extends Message<PaymentTransactionCompleted>{
    static TYPE = 'Sample.PaymentTransactionCompleted.Command';

    constructor(transactionId: string) {
        super();
        this.message = new PaymentTransactionCompleted();
        this.message.paymentTransactionId = transactionId;
        this.type = PaymentTransactionCompletedCommand.TYPE;
    }
}

class CancelOrderCommand extends Message<CancelOrder> {
    static TYPE = 'Sample.CancelOrder.Command';

    constructor(message: string) {
        super();
        this.message = new CancelOrder();
        this.type = CancelOrderCommand.TYPE;
    }
}

class CompleteOrderCommand extends Message<CompleteOrder>{
    static TYPE = 'Sample.CompleteOrder.Event';

    constructor(orderId: string) {
        super();
        this.message = new CompleteOrder();
        this.message.orderId = orderId;
        this.type = CompleteOrderCommand.TYPE;
    }
}


export class OrderSagaData {
    orderId: string;
    paymentTransactionId: string;
}

export class SampleSaga extends Saga<OrderSagaData> {
    constructor(public bus: Bus, public log: Log) {
        super();

        this.getDefault = () => { return new OrderSagaData() };

        // Configure mappings
        this.sagaKeyMapping.add(StartOrderCommand.TYPE, (message: StartOrder): string => { return message.orderId; });

    };

    public subscribeHandlers() {
        // Registger handlers
        this.subscribeAsSagaStart({ messageType: StartOrderCommand.TYPE, handler: this.StartOrderCommand_Handler});
        this.subscribe({ messageType: PaymentTransactionCompletedCommand.TYPE, handler: this.PaymentTransactionCompletedCommand_Handler });
        this.subscribe({ messageType: CompleteOrderCommand.TYPE, handler: this.CompleteOrderCommand_Handler });
        this.subscribe({ messageType: CancelOrderCommand.TYPE, handler: this.CancelOrderCommand_Handler });

    }
    //@messageHandler(testData.TestMessage.TYPE)
    StartOrderCommand_Handler(message: StartOrder, context: MessageHandlerContext) {
        this.data.orderId = message.orderId;
        this.data.paymentTransactionId = Guid.newGuid();

        this.log.info(`Saga with OrderId ${this.data.orderId} received StartOrder with OrderId ${message.orderId}`);
        var issuePaymentRequest = new PaymentTransactionCompletedCommand(this.data.paymentTransactionId);

        context.send(issuePaymentRequest);
    }

    //@messageHandler(testData.TestMessage.TYPE)
    PaymentTransactionCompletedCommand_Handler(message: PaymentTransactionCompleted, context: MessageHandlerContext) {
        this.log.info(`Transaction with Id ${this.data.paymentTransactionId} completed for order id ${this.data.orderId}`);
        var completedOrder = new CompleteOrderCommand(this.data.orderId);
        context.send(completedOrder);
    }

    //@messageHandler(testData.TestMessage.TYPE)
    CompleteOrderCommand_Handler(message: CompleteOrder, context: MessageHandlerContext) {
        this.log.info(`Saga with OrderId ${this.data.orderId} received CompleteOrder with transactionId ${this.data.paymentTransactionId}`);
        this.markAsComplete();
    }

    //@messageHandler(testData.TestMessage.TYPE)
    CancelOrderCommand_Handler(message: CancelOrder, context: MessageHandlerContext) {
        debugger;
        this.log.info(`Saga with OrderId ${this.data.orderId} received CompleteOrder with OrderId ${message.orderId}`);
        this.markAsComplete();
    }

}

describe("Saga reciving a message that starts a Saga", () => {
    let bus = new Bus();
    let log = new Log();

    let saga = new SampleSaga(bus, log);
    saga.subscribeHandlers();

    it("should initialize default data", async () =>  {
        bus.publish(new StartOrderCommand("123"));
        bus.publish(new StartOrderCommand("456"));
        await Utils.sleep(20);
        debugger;
        expect(log.events.length).toBe(3);
        var logOutput = log.events.toString();
        expect(logOutput).toBe("");
    });

});
