# Send Messages
1 Support timeout

# Handlers
1 Support debounce/throttling

# Transports
1 Queued messages
1 Persistent messages
1 Worker processes
1 Service workers

# Sagas

# Decorators


# Error handler
1 inbound messages dispatching is not covered by the pipeline error handling
  until its be validated. Exceptions that happen prior result in unhandled promise rejections
  need to publish messages or have an event handler to process them. Favouring pubishing to keep
  it consistent.


# Registering handlers
1 Most class based handlers are global inscope and can not be registered twice. As such its not necessary
  to have multiple instances of them.
1 Sagas operate on a instance basis. As such each time a Saga is started a new instance needs to be created. 
  The old way of registering handlers via prototypes and having decorators do the subscriptions prevented this
  from happening as it was global in scope. Pushing the subscription back to the bus allows this to now work easily  

# Testing
Capturing the messages either via Bubbles or otherwise, it should be possible to create an image of the message flow
for a given test. This can then be included as part of the test output, in the same way a screen shot can be.

  # Bubbles

  Example:
  (!submit-order)-(check-availability)-(:availability-results)
                 \(check-)

  (!CreateOrderMessage)-[RequestAuthorization]-[Authorization-Manager1|Authorization-Manager2]
                        



  RequestAuthorization:= (AuthorizationRequestMessage-Manager1)
                        =(AuthorizationRequestMessage-Manager2)
                        =(OrderStatusUpdatedMessage)
                        =(TimeoutMessage)                       
  
  RequestAuthorization:
   (AuthorizationRequestMessage-Manager1)|(AuthorizationRequestMessage-Manager2)
  |(OrderStatusUpdatedMessage)
  |(TimeoutMessage)                       

  Authorization-Manager1:
  -(!AuthorizationResponseMessage-Manager1)-(OrderStatusUpdatedMessage-Authorized)

  Authorization-Manager2:
  ----(!AuthorizationResponseMessage-Manager2)-(OrderStatusUpdatedMessage-Accepted)

  (name) - a message definition ie (submit-order)
    * names should use dashes notation
  
  

  = - messages are sent in parallel  
  * - published message
  !* - published message supplied by the test
  !: - response to a sent message supplied by the test
  - - represents a time period default is 10ms
  [] - Group
  
  error responses:
  {
    error: "error description"
  }

  hooks - as some validation can be tricky adding a hookBubble field with a function will allow for custom
          validation. These will be ignored by the JSON.stringify function.
          (message:IMessage<any>, context:IMessageHandlerContext): boolean

  API
  workflow = string representation as defined above
  messages{} = as hash table with each message definition required by the workflow. Including the initial message.
  let bus = new Bus()
  bus.start();
  bubbles.validate(messages, workflow, bus?);



# Future (Bubbles)
The current implementation of Bubbles handles many scenarios. However, for more complex parallel scenarios, it maybe difficult or impossible for property validate the flows. The section describes the future additions that will support this ability.

More complex scenarios may look like the following:
```
(!submit-order)-(request-authorization-manager1)----(authorization-manager1)-(update-order-status-approved)
                \(request-authorization-manager2)--------------(authorization-manager2)
                \(update-order-status)
                \(order-timeout)
```
In this scenario we are requesting an order which has to be authorized before the order can be approved. Two requests are sent to two different managers. Either one of them can approve the order, which in this case was `manager1`. Once the manager has approved the order then a status update is sent indicating the order has been approved.

This scenario has a number of parallel tasks happening. This could still be validated using Bubbles by flattening the message flow. Which would look something like:

```
(!submit-order)-(request-authorization-manager1)(request-authorization-manager2)(update-order-status)(order-timeout)----(authorization-manager1)-(update-order-status-approved)------(authorization-manager2)
```
While this would likely work, after all its just a stream of messages. Trying to understand this is a different problem!


(!submit-order)-(check-availability)-(:availability-results)
                 \(check-)

  (!CreateOrderMessage)-[RequestAuthorization]-[Authorization-Manager1|Authorization-Manager2]
                        



  RequestAuthorization:= (AuthorizationRequestMessage-Manager1)
                        =(AuthorizationRequestMessage-Manager2)
                        =(OrderStatusUpdatedMessage)
                        =(TimeoutMessage)                       
  
  RequestAuthorization:
   (AuthorizationRequestMessage-Manager1)|(AuthorizationRequestMessage-Manager2)
  |(OrderStatusUpdatedMessage)
  |(TimeoutMessage)                       















The current request response pattern definition doesn't make the following message flow easy to define:

```
A-->B-->C-->B.reply
```

Where the `B` handler sends a message and then also returns a reply back to `A` via `B.reply`. Its envisioned that this can be handled via defining parallel flows.


Sample workflows
https://webhelp.episerver.com/14-1/en/Content/Commerce/IN_WorkingProcedure.htm
https://webkul.com/blog/wp-content/uploads/2017/04/Shopping-Cart-Customer.png
