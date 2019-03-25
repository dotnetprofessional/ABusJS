# Sending messages 
ABus supports sending different types of messages ([see Messages, Events, and Commands](messages.md)). Messages can be sent either directly from the bus or from within a handler as part of handling an incoming message. When a message arrives at a transport, it goes through a [pipeline of processing tasks](pipeline.md).

ABus supports two ways of sending a message depending on its intent:

## Commands (1..1)
The send methods are used to send a command, which is intended to communicate with a single handler (or endpoint). Should more than one subscriber be detected or no subscribers be detected, then an error will be published to the bus, see the [Errors section](errors.md) for more details.

There are three methods to send commands:

* sendAsync: send without waiting
* sendWithReplyAsync: send with waiting on reply
* replyAsync: reply to a `sendWithReplyAsync`.

### sendAsync\<T>(message: T | IMessage<T>, options?: ISendOptions): Promise\<void>
Use this method when you want to send a command and not wait for a reply. This is commonly referred to as a [fire-and-forget](https://www.enterpriseintegrationpatterns.com/patterns/conversation/FireAndForget.html) pattern.

#### _parameters_
* __message__: either an object-literal that conforms to the `IMessage` interface, or a class instance, which will be converted to the `IMessage` interface before being sent to the transport.
* __options__: an optional set of options used to control how the message is sent. The options currently available are:

    * __timeToDelay:__ specifies the amount of time that should elapse before the message is actually sent
    * __timeout:__ Provides a finite amount of time for the request to resolve. If the request takes longer than the specified timeout, a `TimeoutException` will be thrown. The default is 60 seconds.
    * __cancellationToken:__ Provides the ability to cancel the request prior to the response being received. The request itself cannot be cancelled, however, an `ReplyHandlerCancelledException` will be thrown when the request resolves. This provides the ability to cancel a series of requests externally. See the [Cancellation section](#cancellation) for further details. 

```ts
import {TimeSpan} from "abus";

await bus.sendAsync(message, { timeout: TimeSpan.FromMilliseconds(5) })
```

### sendWithReplyAsync\<R>(message: object | IMessage<any>, options?: ISendOptions): Promise\<R>
Use this method when you need to get a response/reply to the command being sent. This is commonly referred to as a [request-response](https://www.enterpriseintegrationpatterns.com/patterns/messaging/RequestReply.html) pattern. Its important that the handler uses the `.reply` method to return the result. Otherwise this method will timeout, as ABus has behind the scenes configured a handler to receive the reply. To help ensure this pattern is used correctly, it is highly advised that the request an response message types be named consistently, as defined in the [message naming](messages.md#Naming) section.

```ts
const result = await bus.sendWithReply(message);
```

### replyAsync\<T>(reply: T): Promise\<void>
The `replyAsync` method unlike the other send methods, is not available directly on the bus. Its only available from within a [handlers](receiving-messages.md) [message handler context](context.md). That's because it must be sent within the context of the current message, as that's what is being replied to.

Another thing that makes this method different, is that it doesn't take options or take a message type. The parameter is simply the data that needs to be returned. ABus will automatically convert this to an `IMessage<T>` when putting it on the bus.

```ts
@handler("ORDER-COMPLETE")
async orderCompleteHandler(message: OrderComplete, context: IMessageHandlerContext) {
    // do work here...
    await context.replyAsync("COMPLETED");
}
```

### Cancellation
The `sendWithReplyAsync` method is unique in that because it waits for a response, it also supports the ability to cancel the request. Now this is a little misleading, in so far as the request once its been received by the handler can't be cancelled. However, for transports that support cancellation, it could mean removing it from the queue if the handler hasn't yet processed it. However, for the most part it will mean that when the response arrives it will throw an exception which can be used to short-circuit additional logic.

Here's an example of how to implement cancellation:
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
In this example a `CancellationToken` is created and passed as an option to the `sendWithReplyAsync` method. The next line captures the promise which will be resolved once a reply is received. However, before a reply is received it is cancelled, then next line awaits the result from the caller. This is a contrived example, however if there was other code running which performed the cancellation on the token while the main code was waiting for the return, the main code would receive an `ReplyHandlerCancelledException` once the reply had returned rather than the result. Which for this example would eliminate running the expensive code that processes the result.

## Events (0..n)
The publish method is used to send an event, which is intended to communicate with multiple handlers (or endpoints). No error is raised if there are no subscribers as this maybe a valid scenario.

#### publishAsync\<T>(message: IMessage<T> | T, options?: ISendOptions): Promise\<void>
Use this method when you want to publish an event. The nature of publishing events, means its not important if anything receives the message, only that it was published. This is commonly referred to as a [fire-and-forget](https://www.enterpriseintegrationpatterns.com/patterns/conversation/FireAndForget.html) pattern. This method shares the same [parameters](#parameters) as the send methods. The key difference is the message is stamped with a `publish` intent.

```ts
import {TimeSpan} from "abus";

await bus.publishAsync(message, { timeout: TimeSpan.FromMilliseconds(5) })
```

> __Use of await keyword with the `sendAsync` and `publishAsync` methods does not mean the code will wait until the handler has processed the message. It means that the code will wait until the message has been put into the pipeline successfully. This provides an opportunity for some error conditions to be caught.__