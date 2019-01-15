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
  
  ## Message definitions
  name: type: SUBMIT_ORDER, orderId:123456
  ! - message is supplied by the test
  = - messages are sent in parallel  
  : - response to a sent message
  * - published message
  > - send with reply (only )
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


# Patterns

## request response
To override a request with a supplied response. This will prevent the message from being received by the 
original handler.

### 
(!request:response)     - immediate response
(!request:---response)  - delayed response
---(!request:response)  - wait 3 time periods before sending request response. Has same affect as previous, but previous is more logical

## supply a message
This will send the message to the bus and allow the message to be handled by any subscribers

(previous-message)(!request)      - send message to the bus after the previous-message is received
---(!request)                     - wait 3 time periods before sending the request
