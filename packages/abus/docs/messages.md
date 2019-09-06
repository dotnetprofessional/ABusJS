# Messages
A message is the means by which ABus communicates. There are two types of messages, commands and events, that capture more of the intent and help ABus enforce messaging best practices.

|Command|Event
| -                                            | -                                                                    |
| Used to make a request to perform an action. | Used to communicate that an action has been performed.               |
| Has one logical owner.                       | Has one logical owner.                                               |
| Should be sent to the logical owner.         | Should be published by the logical owner.                            |
| Cannot be published.                         | Cannot be sent.                                                      |
| Must be subscribed to and only once          | Can be subscribed to with 0..n subscribers and be unsubscribed from. |

## Naming
When choosing the name of a message, its type should be used to describe the tense of the message.

### Commands
Commands should be expressed in a verb-noun sequence, following the _tell_ style.

_Examples:_

* UpdateCustomerAddress
* UpgradeCustomerAccount
* SubmitOrder

### Events
Events should be expressed in a noun-verb (past tense) sequence, indicating that something happened.

_Examples:_

* CustomerAddressUpdated
* CustomerAccountUpgraded
* OrderSubmitted
* OrderAccepted
* OrderRejected
* OrderShipped

### Request/Response Commands
Request messages should be expressed using a verb-noun like other commands. However, due to the special nature of the request/response pattern its important that the names convey that the command will result in a reply that the code should wait for. Also the response message should be expressed using noun-noun.

_Request Examples:_

* GetOrder
* RetrieveOrder
* SearchOrders 
* CheckOrderStatus 

_Response Examples:_

* OrderDetail
* OrderSearchResults
* OrderStatusResult

If its not clear from the naming that a response should be returned, then using a suffix such as `Response`, `Result(s)` may help. The important thing is that its clear from the message name that its part of a request/response pattern.

## Validation
To ensure common mistakes are caught early. Abus enforces a few validations when sending messages.

* Messages being sent must have a subscriber. Failure to have one will result in an exception.
* Messages being published do not require any subscribers.
* Replies can only be performed on a message that was originally sent with the `sendWithReplyAsync` method.

## Designing messages
Messages represent data contracts between observers. They should be designed according to the following guidelines.

Messages should:

* be simple [POJO](https://en.wikipedia.org/wiki/Plain_old_Java_object) types.
* be as small as possible.
* satisfy the [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single_responsibility_principle) .

## Defining messages
ABus has only one restriction on how a message is defined, which is that it must contain a `type` property. There are no restrictions on the value the type is given.  ABus supports two ways to create a message definition. Each has its advantages and disadvantages.

### __Object literal__
Messages can be created by simply defining an object literal with a `type' property. Otherwise the structure is largely up to the developer. Here are the various ways you might decide to define your messages using an object literal.

_absolute minimum_
```ts
const message = {type: "ORDER-COMPLETE"}; 
```

_with some data_
```ts
const message = {type: "ORDER-COMPLETE", orderId: "123456"}; 
```

_using a payload_
```ts
const message = { type: "ORDER-COMPLETE", payload: { orderId: "123456" } };
```

### __Class__
While a message should be simple POJO it can be useful to model them using classes. The advantage is that Abus will automatically wrap the serialized version with the type property and assign the name. This means your code only sees the `real message` and not the noise of the infrastructure. However, ensure you don't add any behavior as all messages should be serializable.

_simple class_
``` ts
class OrderComplete {
    orderId: string;
}
```
This version doesn't enforce that each property be set, and requires that the properties be set individually.

```ts
const message = new OrderComplete);
message.orderId = "123456";
```

_typescript property initializers_
``` ts
class OrderComplete {
    constructor(public orderId: string) { }
}
```
This version automatically adds the `orderId` property to the class, and enforces that the orderId be passed to create an instance.

```ts
const message = new OrderComplete("12356");
```

#### Serialization
Regardless of which class option you chose, when the instance is sent it will look like this on the bus.

```
{
    type: "OrderComplete",
    payload: {
        orderId: "123456"
    }
}
```

When using a class the type is derived from the class name and its derived types (ie it will use the inheritance chain too). However if you are mangling your code, these names will be corrupted. To overcome this issue, or if you want to simply control the type name, you can use the `@identifier` decorator to manually define a name.

``` ts
@identifier("ORDER-COMPLETE")
class OrderComplete {
    orderId: string;
}
```
When the instance is sent it will look like this on the bus.

```
{
    type: "ORDER-COMPLETE",
    payload: {
        orderId: "123456"
    }
}
```

### __Comparison__
While either of the two approaches will work, there are things to consider when choosing your option. The use of a class  

|                support                | object literal | class |
| -                                     | -              | -     |
| bus.registerHandlers                  | X              | ✔     |
| bus.unregisterHandlers                | X              | ✔     |
| @handler                              | X              | ✔     |
| handler passed payload as message     | ✔*             | ✔     |
| handler passed full object as message | ✔**            | X     |
| message context has full object       | ✔              | ✔     |

\* only when message has a payload property

\** only when message does not have a payload property
 