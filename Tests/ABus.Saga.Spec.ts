describe.skip("dummy to preserve spec file", ()=>{
    it.skip("something", ()=>{

    });
});

// //import { Saga, SagaTimeout } from '../Saga'
// import { Bus} from '../ABus'
// import Log from './Logging'
// import {MessageHandlerContext} from '../MessageHandlerContext'
// import {Message} from '../Message'
// import {Utils} from '../Utils'
// import {Guid} from '../Guid'
// import TimeSpan from '../TimeSpan'

// import * as testData from './ABus.Sample.Messages'

// // Define messages for the Saga
// class StartOrder {
//     orderId: string;
// }

// class CancelOrder extends StartOrder {

// }

// class CompleteOrder extends StartOrder {

// }

// class PaymentRequest {
//     paymentRequestId: string;
// }

// class StartOrderCommand extends Message<StartOrder> {
//     static TYPE = 'Sample.StartOrder.Command';

//     constructor(orderId: string) {
//         super()
//         this.message = new StartOrder();
//         this.message.orderId = orderId;
//         this.type = StartOrderCommand.TYPE;
//     }
// }

// class PaymentTransactionCompleted {
//     paymentTransactionId: string;
// }

// class PaymentTransactionCompletedCommand extends Message<PaymentTransactionCompleted>{
//     static TYPE = 'Sample.PaymentTransactionCompleted.Command';

//     constructor(transactionId: string) {
//         super();
//         this.message = new PaymentTransactionCompleted();
//         this.message.paymentTransactionId = transactionId;
//         this.type = PaymentTransactionCompletedCommand.TYPE;
//     }
// }

// class CancelOrderCommand extends Message<CancelOrder> {
//     static TYPE = 'Sample.CancelOrder.Command';

//     constructor() {
//         super();
//         this.message = new CancelOrder();
//         this.type = CancelOrderCommand.TYPE;
//     }
// }

// class CompleteOrderCommand extends Message<CompleteOrder>{
//     static TYPE = 'Sample.CompleteOrder.Event';

//     constructor(orderId: string) {
//         super();
//         this.message = new CompleteOrder();
//         this.message.orderId = orderId;
//         this.type = CompleteOrderCommand.TYPE;
//     }
// }


// export class OrderSagaData {
//     orderId: string;
//     paymentTransactionId: string;
// }

// export class SampleSaga extends Saga<OrderSagaData> {
//     constructor(public bus: Bus, public log: Log) {
//         super();

//         this.getDefault = () => { return new OrderSagaData() };

//         // Configure mappings
//         this.sagaKeyMapping.add(StartOrderCommand.TYPE, (message: StartOrder): string => { return message.orderId; });

//         // Registger handlers
//         this.subscribeAsSagaStart({ messageType: StartOrderCommand.TYPE, handler: this.StartOrderCommand_Handler });
//         this.subscribe({ messageType: PaymentTransactionCompletedCommand.TYPE, handler: this.PaymentTransactionCompletedCommand_Handler });
//         this.subscribe({ messageType: CompleteOrderCommand.TYPE, handler: this.CompleteOrderCommand_Handler });
//         this.subscribe({ messageType: CancelOrderCommand.TYPE, handler: this.CancelOrderCommand_Handler });
//     };

//     //@messageHandler(testData.TestMessage.TYPE)
//     async StartOrderCommand_Handler(message: StartOrder, context: MessageHandlerContext) {
//         this.data.orderId = message.orderId;
//         this.data.paymentTransactionId = Guid.newGuid();

//         this.log.info(`StartOrderCommand_Handler with data.orderId = ${this.data.orderId} and message.orderId = ${message.orderId}`);
//         await Utils.sleep(1);
//         debugger;
//         var issuePaymentRequest = new PaymentTransactionCompletedCommand(this.data.paymentTransactionId);

//         context.send(issuePaymentRequest);

//         this.requestTimeout(context, this.TimeoutCommand_Handler, TimeSpan.FromMilliseconds(100));
//     }

//     //@messageHandler(testData.TestMessage.TYPE)
//     PaymentTransactionCompletedCommand_Handler(message: PaymentTransactionCompleted, context: MessageHandlerContext) {
//         this.log.info(`PaymentTransactionCompletedCommand_Handler with data.orderId = ${this.data.orderId} and message.paymentTransactionId ${!!message.paymentTransactionId}`);
//         var completedOrder = new CompleteOrderCommand(this.data.orderId);
//         if (this.data.orderId === "XXX") {
//             // Force a timeout of this message
//             return;
//         }

//         context.send(completedOrder);
//     }

//     //@messageHandler(testData.TestMessage.TYPE)
//     CompleteOrderCommand_Handler(message: CompleteOrder, context: MessageHandlerContext) {
//         this.log.info(`CompleteOrderCommand_Handler with data.orderId = ${this.data.orderId} and message.orderId = ${message.orderId}`);
//         this.markAsComplete();
//     }

//     //@messageHandler(testData.TestMessage.TYPE)
//     CancelOrderCommand_Handler(message: CancelOrder, context: MessageHandlerContext) {
//         this.log.info(`CancelOrderCommand_Handler with data.orderId = ${this.data.orderId} and message.orderId = ${message.orderId}`);
//         this.markAsComplete();
//     }

//     TimeoutCommand_Handler(message: SagaTimeout, context: MessageHandlerContext) {
//         this.log.info(`TimeoutCommand_Handler with data.orderId = ${this.data.orderId} and message.data = ${message.data}`);
//         context.send(new CancelOrderCommand());
//     }
// }
// describe.skip("Saga receiving a message that starts a Saga", () => {
//     let bus = new Bus();
//     let log = new Log();

//     let saga = new SampleSaga(bus, log);

//     it.skip("should initialize default data", async () =>  {
//         bus.publish(new StartOrderCommand("123"));
//         bus.publish(new StartOrderCommand("456"));
//         bus.publish(new StartOrderCommand("XXX"));

//         await Utils.sleep(500);
//         debugger;
//         var actual = log.toString();
//         var expected = Utils.fromJsonFile('./Tests/TestData/Saga.MultipleTransactions.json');
//         expect(log.events).toEqual(expected);
//         saga.dispose();
//     });

// });
// /*  Disabled until new Queue model is ready

// describe("Saga with a timeout defined", () => {

//     //jest.useFakeTimers();
    
//     it("should execute the timeout handler when the timeout expires if Saga still active", async () => {
//         let bus = new Bus();
//         let log = new Log();
//         let saga = new SampleSaga(bus, log);
//         var orderId = "XXX";
//         bus.publish(new StartOrderCommand(orderId));

//         // Wait long enough for Saga to complete and timer to have expired
//         await Utils.sleep(110);

//         var actual = log.toString();
//         expect(saga.data).toBeFalsy();
//         expect(saga.storage.get(orderId)).toBeFalsy();
//         var expected = Utils.fromJsonFile('./Tests/TestData/Saga.TimeoutFired.json');
//         expect(log.events).toEqual(expected);
//         saga.dispose();
//     });

//     it("should not fire timeout if saga completes in time", async () => {
//         let bus = new Bus();
//         let log = new Log();
//         let saga = new SampleSaga(bus, log);
//         var orderId = "123";
//         bus.publish(new StartOrderCommand(orderId));

//         // Wait long enough for Saga to complete and timer to have expired
//         await Utils.sleep(110);

//         expect(saga.data).toBeFalsy();
//         expect(saga.storage.get(orderId)).toBeFalsy();
//         var actual = log.toString();
//         var expected = Utils.fromJsonFile('./Tests/TestData/Saga.WithTimeoutCompletes.json');
//         expect(log.events).toEqual(expected);
//         saga.dispose();
//     });
// });
//     */
