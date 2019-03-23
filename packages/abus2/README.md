# What is it?
_A transport agnostic messaging API for javascript_

ABus provides a simplified messaging API that can be used against multiple message transports such as in memory, ws-sockets and signalR etc. It is inspired by server side messaging libraries such as [NServiceBus](https://particular.net/nservicebus). It provides the flexibility to deliver messages to different receivers while maintaining the same api interface. ABus also provides a unified and consistent way of handling the key aspects of an enterprise messaging solution in javascript:

> NB: If you are viewing this from npmjs.com, links and images may be broken. Please visit the [project site](#) to view this document.

## Why yet another messaging library?
There are a number of messaging libraries for Javascript. However, most are not much more than simple event emitters. They serve a purpose as they are fast and can provide a decent level of abstraction. Abus is much more than a simple event emitter. Its designed around the same principles you'd find in a server messaging system. So its more about handling your applications whole process flow than it is about handling `click` events.

## Goals
This project has the following goals:

* __Consistency__
    * Having a consistent way to interact with all parts of the system
* __Traceability__
    * When something goes wrong, you should be able to trace how it got into that state
    * Have the system be self documenting, so its always correct
    * Answer the question of how does this work?
* __Testability__
    * Complex systems need to be tested and testing needs to be a first-class citizen
* __Configurability__
    * Decisions on where something is processed should be configurable, which goes back to consistency.
* __Developer Experience__
    * Have a great developer experience and make writing software easy and fun!

If you value these goals then check out the detailed documentation. However, to peak your interest, here are just a few of the awesome things you'll be able to do!

### Visualizations
With the advanced tracing abilities, its possible to generate visualizations that self document your system.

![x](https://github.com/dotnetprofessional/ABusJS/raw/dnp/abus-2/packages/abus-bubbles/docs/images/sequence-diagram.PNG)

See the Visualizations docs for more details

### Super clean way of testing
Testing message based systems is hard. It can be an issue that prevents teams from adopting a message based approach. However, using Bubbles which is inspired by [marble diagrams](http://reactivex.io/rxjs/manual/overview.html#marble-diagrams), you can write tests in a very simple declarative style. Bubble tests also have support for mocking!

This example demonstrates how you would test the process represented by the visualization above.

```ts
scenario(`Retrieve agreement headers for TPID`, () => {
    when(`requesting the agreement headers the following flow occurs
        """
        (!request-headers)(*status-executing)(>api-request)(@api-response)(*request-headers-event)(*status-complete)
    
        request-headers: {"type":"GetAgreementHeadersCommand", "payload": {"tpid": "12345"}}
        api-request: {"type":"GetAgreementHeadersRequest", "payload": {"tpid": "12345"}}
        api-response: {"tpid": "12345", "agreementHeaders": [{"id":"1"},{"id":"2"}]}
        request-headers-event: {"type":"ParentCompanyHeadersEvent", "payload": {"tpid": "12345", "agreementHeaders": [{"id":"1"},{"id":"2"}]}}
        status-executing: {"type":"AgreementProcessStatusEvent", "payload": {"operation": "GetAgreementHeadersCommand", "status": "EXECUTING"}}
        status-complete: {"type":"AgreementProcessStatusEvent", "payload": {"operation": "GetAgreementHeadersCommand", "status": "COMPLETE"}}
        """
        `, async () => {
            await bubbles.executeAsync(stepContext.docString);
        });

    then(`the headers are returned for the tpid`, () => {
        bubbles.validate();
    });
});
````
> The sample here uses the [livedoc-mocha](https://github.com/dotnetprofessional/LiveDoc/tree/master/packages/livedoc-mocha#readme) testing library.

See the [Bubbles docs](https://github.com/dotnetprofessional/ABusJS/blob/dnp/abus-2/packages/abus-bubbles/README.md) for more details

### Redux support
If you're writing a front end system, there's a reasonable chance you're using [react](https://reactjs.org/) and [redux](https://redux.js.org/). Abus is a great counterpart to these technologies and has first class integrations.

See the Redux docs for more details



## A Simple Example
The following is a simple example of using Abus to send and receive a message.

_imperative style_

The imperative style is very similar to most of the other libraries where you explicitly register with the bus and pass it a call back function. This style is great for simple examples, but for larger implementations this style can be cumbersome.
```ts
const bus = new Bus();

// ensure transports are listening for incoming messages
bus.start();

bus.subscribe("ORDER-COMPLETE", (message: any, context: IMessageHandlerContext) => {
    console.log()
});

bus.sendAsync({ type: "ORDER-COMPLETE"});
```

_declarative style_

An alternative to interacting with the bus directly when subscribing to messages is to use a more declarative style. Where you annotate a method to be the receiver of a message type. This style allows for a greater level of decoupling, and prevents the need to have all subscribers know about the bus.


```ts
class DeliverOrder {
    @handler("ORDER-COMPLETE")
    orderCompleteHandler(message: any, context: IMessageHandlerContext) {
        console.log()
    }
}

const bus = new Bus();

// ensure transports are listening for incoming messages
bus.start();

// subscribes ALL handlers within the class
bus.registerHandlers(DeliverOrder);

bus.sendAsync({ type: "ORDER-COMPLETE"});
```
> The declarative style is only supported with classes. If your project cannot use classes, then the imperative style should be used.


* [Installing](#Installing)
* [API reference](docs/API.md)
* [Tutorial](docs/Tutorial.md) 

