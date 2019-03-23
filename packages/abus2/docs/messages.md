# Messages
A message is the means by which ABus communicates. There are two types of messages, commands and events, that capture more of the intent and help ABus enforce messaging best practices.

|Command|Event
| -                                            | -                                                          |
| Used to make a request to perform an action. | Used to communicate that an action has been performed.     |
| Has one logical owner.                       | Has one logical owner.                                     |
| Should be sent to the logical owner.         | Should be published by the logical owner.                  |
| Cannot be published.                         | Cannot be sent.                                            |
| Must be subscribed to and only once          | Can be subscribed to multiple times and unsubscribed from. |

## Validation
To ensure common mistakes are caught early. Abus enforces a few validations when sending messages.

* Messages being sent must have a subscriber. Failure to have one will result in an exception.
* Messages being published do not require any subscribers.
* replies can only performed on a message that was originally sent with the `sendWithReplyAsync` method.

## Designing messages
Messages represent data contracts between observers. They should be designed according to the following guidelines.

Messages should:

* be simple POCO types.
* be as small as possible.
* satisfy the [Single Responsibility Principle](https://en.wikipedia.org/wiki/Single_responsibility_principle) .

## Defining messages
ABus has only one restriction on how a message is defined, which is that it must contain a `type` property. There are no restrictions on the name or type it is given. However, using the following conventions will aid in understanding the message intent, which will aid in understanding how a message is expected to be used.

| Intent           | Ends With        |
| -                | -                |
| command          | Command          |
| request/response | Request/Response |
| event            | Event            |

## Implementing Messages
ABus supports two ways to create a message definition. Each has its advantages and disadvantages.

### __Object literal__
Messages can be created by simply defining an object literal with a `type' property. Otherwise the structure is largely up to the developer. Here are the various ways you might decide to define your messages.

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
While a message should be simple POJO it can be useful to model them using classes. The advantage is that Abus will automatically wrap the serialized version with the type property and assign the name. This means you code only sees the `real message` and not the noise of the infrastructure. However, ensure you don't add any behavior as all messages should be serializable.

_simple class_
``` ts
class OrderComplete {
    orderId: string;
}
```

_typescript property initializers_
``` ts
class OrderComplete {
    constructor(public orderId: string) { }
}
```
This version automatically adds the `orderId` property to th class, and enforces that the orderId be passed to create an instance.

```ts
const message = new OrderComplete("12356");
```
When the instance is sent it will look like this on the bus.

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

> Messages documentation adapted from the [NServiceBus documentation](https://docs.particular.net/nservicebus/messaging/messages-events-commands)   