# API
The ABus API consists of the following core areas:

* Configuration
* Sending messages
* Receiving messages
* Transports

> To fully understand the API docs, its going to be important to understand the core messaging concepts that Abus is built on. It is therefore recommended that the [Concepts](concepts.md) section be read before this section.

## Configuration
Before a message can be sent or received, the bus requires configuration. At its simplest, only the following lines are required:

```ts
import {Bus} from "abus";

const bus = new Bus();
bus.start();
```

This code creates an instance of the bus and starts the default transports ready to listen for incoming messages. The start method is more important when working with transports that need to connect to external sources such as a server.

However, there are many other options that can be configured at this stage. Namely around routing messages to particular transports. By default the `ExpressMemoryTransport` is configured for all messages. This transport provides an simple and efficient in memory transport.

Refer to the [transports section](transports.md) for more details on how to configure transports.

### IoC
If your application uses an [IoC container](https://www.martinfowler.com/articles/injection.html), ABus can be configured to make use of it. ABus ships with support for the [inversify](http://inversify.io/) library. However, any library can be supported by implementing a simple interface. To configure inversify requires the following code:

```ts
import { Container } from 'inversify';
import { InversifyIoC } from 'abus-inversify';

let container = new Container();

const bus = new Bus();
bus.usingIoC(new InversifyIoC(container));
bus.start();
```
Refer to the [Custom IoC section](custom-ioc.md) for more details on how to support other IoCs.

## Sending messages 
ABus supports sending different types of messages ([see Messages, Events, and Commands](messages.md)). Messages can be sent either directly from the bus or from within a handler as part of handling an incoming message. When a message arrives at a transport, it goes through a [pipeline of processing tasks](pipeline.md).

ABus supports two ways of sending a message depending on its intent:

### Commands (1..1)
The send methods are used to send a command, which is intended to communicate with a single handler (or endpoint). Should more than one subscriber be detected or no subscribers be detected, then an error will be published to the bus, see the [Errors section](errors.md) for more details.

#### _sendAsync\<T>(message: T | IMessage<T>, options?: ISendOptions): Promise\<void>_
Use this method when you want to send a command and not wait for a reply. This is commonly referred to as a [fire-and-forget](https://www.enterpriseintegrationpatterns.com/patterns/conversation/FireAndForget.html) pattern.

#### _sendWithReplyAsync\<R>(message: object | IMessage<any>, options?: ISendOptions): Promise\<R>_
Use this method when you need to get a response/reply to the command being sent. This is commonly referred to as a [request-response](https://www.enterpriseintegrationpatterns.com/patterns/messaging/RequestReply.html) pattern. Its important that the handler uses the `.reply` method to return the result. Otherwise this method will timeout, as ABus has behind the scenes configured a handler to receive the reply. To help ensure this pattern is used correctly, it is highly advised that the request an response message types be named consistently, as defined in [Defining message](messages.md#Defining-messages) section

__cancellation__

The `sendWithReplyAsync` method is unique in that because it waits for a response, it also supports the ability to cancel the request. Now this is a little misleading, in so far as the request once its been received by the handler it can't be cancelled. However, for transports that support cancellation, it could mean removing it from the queue if the handler hasn't yet processed it. However, for the most part it will mean that when the response arrives it will throw an exception which can be used to short-circuit additional logic.

Here's an example of how to implement a cancellation:
```ts
try {
    const cancellationToken = new CancellationToken();
    // configure send to support a cancellation token
    const p = bus.sendWithReplyAsync<string>({ type: "GET-DATA" }, { cancellationToken });
    // can be cancelled from anywhere that has access to this token
    cancellationToken.cancel();
    // wait for the result to arrive
    result = await p;
    // expensive code that processes the result
    ...
} catch (e) {
    // process the error if needed or simply ignore it
    exception = e;
}
```
In this example a `CancellationToken` is created and passed as an option to the `sendWithReplyAsync` method. The next line captures the promise which will be resolved once a reply is received. However, before a reply is received it is cancelled, then next line awaits the result from the caller. This is a contrived example, however if there was other code running which performed the cancel on the token while the main code was waiting for the return, the main code would receive an exception once the reply has returned rather than the result. Which for this example would eliminate running the expensive code that processes the result.

#### _parameters_
* __message__: either a object-literal that conforms the the `IMessage` interface, or a class instance, which will be converted to the `IMessage` interface before being sent to the transport.
* __options__: an option set of options used to control how the message is sent. The options currently available are:
    * timeToDelay: specifies the amount of time that should elapse before the message is actually sent
    * timeout: Provides a finite amount of time for the request to resolve. If the request takes longer than the specified timeout, a timeout exception will be thrown. The default is 60 seconds.
    * cancellationToken: Provides the ability to cancel the request prior to the response being received. The request itself cannot be cancelled, however, an exception will be thrown when the request resolves. This provides the ability to cancel a series of requests externally.

## Events (0..n)


## Receiving messages

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

