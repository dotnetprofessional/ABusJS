# Cancellation Policies

There are times when several messages are sent in quick succession and it would be a waste of resources to process them all to completion.

In these scenarios its helpful to be able to automatically cancel or  otherwise handle the messages differently. Using a cancellation policy provides the ability to control the lifecycle of a request that is currently being processed by a handler. The supported policies are:

* [cancelExisting](_Cancellation.md#cancelExisting) 
* [ignoreIfDuplicate](_Cancellation.md#ignoreIfDuplicate)
* [ignoreIfExisting](_Cancellation.md#ignoreIfExisting)


Common scenarios where this would be useful include:

* Requesting data from external sources
* Refreshing lists

A cancellation policy is applied to the handler which will be handling the incoming message. Using the send options parameter of the subscription:

_code_
```ts
bus.subscribe(type, async (message: any, context: IMessageHandlerContext) => {
    ...
}, { cancellationPolicy: CancellationPolicy.cancelExisting });
```

_decorator_
```ts
@handler(type, { cancellationPolicy: CancellationPolicy.cancelExisting })
async type_handler(message: number) {
    ...
}
```

## cancelExisting
When a new message is sent, it will set the existing running handlers context `wasCancelled` to `true`. This will prevent messages being sent or received by the current instance of the handler. It will not stop the code currently executing within the handler. The exact behavior will depend on the method being executed and its life cycle.

__.sendAsync | .publishAsync__
* sending to existing handler: If a message is being sent to a handler that is already processing a previous message. Then the previous messages context will be marked as cancelled by setting the `wasCancelled` property of the context. The message will then be dispatched to a new instance of the handler.
* cancelled handler: In this scenario if a handler is attempting to dispatch a message after the handler has been cancelled. Then the message will effectively be ignored and not dispatched. 

__.sendWithReply__
This scenario has two variations, as it both sends and awaits the receipt of a message. In the case of sending a message the behavior is the same as the `.sendAsync | .publishAsync` methods. However, if the message has already been dispatched and a reply arrives after the handler has been cancelled then rather than returning the payload, it will instead throw the exception `ReplyHandlerCancelledException`. This is done to ensure that subsequent code is not executed with the payload, and that the handler can catch and either ignore the error (most common) or otherwise handle it based on business needs.

__.replyAsync__
In this scenario the caller is waiting for a response. As such even if the handler is cancelled the caller must still receive a response otherwise it will wait forever. In the same way `.sendWithReply` throws an exception to the caller, the exception `ReplyHandlerCancelledException` is returned to the client via the reply message. This will then generate an exception on the caller which can then be handled and ignored or handled as appropriate. Its also important to note that the reply will still be delivered with the payload of the exception as this is the only way to communicate with the caller.

## ignoreIfDuplicate
When a new message is sent, the message is compared to the message being processed by the current handler. If the messages match then the message will not be dispatched. The policy has no affect on `.replyAsync`.

## ignoreIfExisting
When a new message is sent, and the handler is currently processing another message then the message will not be dispatched. The policy has no affect on `.replyAsync`.

