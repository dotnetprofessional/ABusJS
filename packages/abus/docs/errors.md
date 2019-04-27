# Error Handling
Given the nature of an async messaging library, its not possible to handle errors in the same was as procedural code. As such ABus treats errors the same way as everything else as a message. When an error occurs on the bus, ABus will publish a `MessageException` message with the type `Bus.Error`.

A `MessageException` has the following properties:
* __message:__ error message
* __payload:__ the error object

## Tasks
By default ABus will add the `MessageExceptionTask` to the following pipeline stages.

* outboundStages.logicalMessageReceived
* inboundStages.logicalMessageReceived

 When an error occurs it will add the following meta-data item to the message that caused the error.

* __Bus.Error:__ the error message
* __Bus.Error.Count:__ the number of times the message had errored. This can be useful when using transports that support queues and retries.

This meta-data will be present in the `dev-tools` as well as accessible to any custom tasks as part of the pipeline processing, if they are added before the `MessageExceptionTask` in the pipeline.

## Handling errors
To receive all the errors is a matter of subscribing to the event. The following code will retrieve all `Bus.Error` messages.

```ts
bus.subscribe(MessageException.type, async (message: MessageException, context: IMessageHandlerContext) => {
    // process exception here
});

```
or
```ts
class GlobalErrorHandler {
    @handler(MessageException.type)
    errorHandler(message: MessageException, context: IMessageHandlerContext) {
        // process exception here
    }
}

// register the class handler
bus.registerHandler(GlobalErrorHandler);
```