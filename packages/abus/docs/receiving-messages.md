# Receiving messages
There are three ways of executing code when a message is sent or published:
* __handlers:__ handler instances are instantiated on a per-message basis, executed, and then disposed of.
* __sagas:__ saga instances are also instantiated on a per-message basis, executed, and then disposed of. However they differ from handlers in that, once instantiated, they are passed an instance of a "Data" class. The "Saga Data" is persistent state that is shared between a given saga type based on a key.
* __processes:__ process instances are a singleton version of a saga. This means that there is no key, and so the data is associated with the process type. This can be more useful than a saga if you want to store global state.

## Handing messages
Regardless of how a message arrived on the bus, to receive it you must subscribe to it and implement a handler to process it. ABus supports both an imperative and declarative approach. The imperative approach makes use of the methods directly on the bus to subscribe, whereas the declarative option uses [ES7 decorators](https://medium.com/google-developers/exploring-es7-decorators-76ecb65fb841). If your environment doesn't support ES7 decorators, then the imperative approach will work just as well. 

The examples below assume that a `bus` variable has been [configured](configuration.md).

### subscribe(filter: string, handler: IMessageHandler\<any>, options?: ISubscriptionOptions): string
The subscribe method defines the function that will be called every time a message that matches the filter arrives on the bus. The method then returns a subscriptionID that can be used to unsubscribe later if required.

* __filter:__ defines the message type to subscribe to. This can be a specific type such as `ORDER-COMPLETE` or a wildcard prefix such as `ORDER-*` or a wildcard suffix such as `*-COMPLETE`.    
* __handler:__ the call back function that will be called. The signature of which is `(message: T, context: IMessageHandlerContext): void | Promise<void>`.
* __options:__ these are optional and provide the ability to control how arriving messages get handled.
    * __identifier:__ used to associate/group this handler with another handlers which can then be used in visualizations. A common use is to define the name of a business process such as `OrderProcess`.
    * __cancellationPolicy:__ controls how or if a message gets processed. Refer to the [cancellation policies](cancellation-policies.md) section for more details.

__example__
```ts
const subscriptionId = bus.subscribe("ORDER-COMPLETE", (message: OrderComplete, context: IMessageHandlerContext) => {
    console.log(message.orderId);
});
```
### @handler(type: string | Function, options?: ISubscriptionOptions)
The `@handler` decorator takes the same arguments as the `subscribe` method. The key difference is there is no direct reference to the bus. That's because using decorators is a two step process.

1. define the handler
2. register the handler with the bus

__Defining the handler__
```ts
import {handler} from "abus"

class SubmitOrder { }

class DeliverOrder {
    @handler("ORDER-COMPLETE")
    orderCompleteHandler(message: OrderComplete, context: IMessageHandlerContext) {
        console.log(message.orderId)
    }

    @handler(SubmitOrder)
    submitOrderHandler(message: SubmitOrder, context: IMessageHandlerContext) {
        console.log(message.orderId)
    }
}
```
The `@handler` decorator unlike the subscribe function, can take either a string filter, or a `Function` which would be a class definition. This eliminates the need to define type name constants when using classes, as shown in the example.

__Registering with the bus__

To register the handlers defined using the `@handler` decorator requires the use of the `registerHandlers` method. This will register all the handlers defined within the class. So the following line would actually create two subscriptions. This means adding new subscriptions is simply a matter of adding a new handler function and adding the decorator. 

```ts
// subscribes ALL handlers within the class
bus.registerHandlers(DeliverOrder);
```

Another key feature of the `registerHandlers` method is that it will also iterate an object looking for handlers. This is especially useful for registering many class handlers via an index file, as the following example demonstrates.

```ts
Orders/index.ts
export * from DeliverOrder
export * from SubmitOrder
export * from OrderVerification

another file
import * as Orders from "Orders";
bus.registerHandlers(Orders);
```
In this example with one line of code all three class handlers will have their handlers registered. 

## Handlers
When a message arrives that matches the filter used which subscribing, it will be passed to the registered handler. Each handler has two parameters passed:

* message: the payload of the message
* context: an instance of the `IMessageHandlerContext` providing access to the bus and the current message context.

Handlers are stateless, even when using class handlers. This means that if you set any state on a class it will be lost between handler calls. [Sagas](saga.md) are the recommended way to maintain state between handler calls.

The context object has the same methods as the bus for sending and publishing messages. However, it also has other features. Refer to the section on [context](context.md) for more details.

```ts
@handler("ORDER-COMPLETE")
async orderCompleteHandler(message: OrderComplete, context: IMessageHandlerContext) {
    console.log(message.orderId);
    await context.publishAsync("ORDER-COMPLETED");
}
```
