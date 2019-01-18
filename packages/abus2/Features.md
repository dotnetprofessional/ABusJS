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
  
  # Bubbles
  Bubbles is a library to make testing message based systems much easier. It allows a test to be defined declaratively
  by defining the expected message flows. Bubbles will then execute the message flow and validate that the actual messages
  sent on the bus match the definition. It also provides mocking abilities to override some messages, such as to inject
  error conditions.

  ## Bubbles Spec
  (..)    - Defines a bubble or message definition eg: (submit-order)
  key     - a key used to define the bubble, which is used to lookup the bubble definition. eg: submit-order
  !       - bubbles will send this message eg: (!submit-order)
  -       - a 1 time period (default 10ms) delay before sending a message. Only makes sense when the next bubble has a ! eg: ---(!submit-order)

  # Message types
  :       - response to a sent message (context.reply) eg: (:submit-order-response)
  >       - message was/is sent expecting a reply (bus.sendWithReply) eg: (>api-request)(:api-response)
  *       - message was/is published (bus.publish) eg: (*order-complete)
  default - message will be sent (bus.send) (submit-order)

  # Bubble definition
  Each bubble must have a definition that matches the key used for the bubble. The definitions describe both the a message that will be sent
  as well as the message that is expected to arrive on the bus. Therefore they act, both as a mock definition as well as validation.

  key:    - the bubble key ie submit-order
  message - the message definition in json eg: {"type":"submit-order", "payload":"orderId": "2345" ...}

  # Patterns
  ## request response
  To override a request with a supplied response. This will prevent the sent message from being received by the original handler. This is
  effectively mocking the handler for request.

  (!request:response)     - immediate response
  (!request:---response)  - delayed response
  ---(!request:response)  - wait 3 time periods before sending request response. Has same affect as previous, but previous is more logical

  ## supply a message
  This will send the message to the bus and allow the message to be handled by any subscribers

  (previous-message)(!request)      - send message to the bus after the previous-message is received
  ---(!request)                     - wait 3 time periods before sending the request

  ## errors
  Its possible to handle errors in two ways, either by injecting an error or validating that an error was sent. Either way
  a special bubble error definition is used to define an error.

  Assuming the following bubble definitions.

  api-request: {"type":"api-request}
  api-response: {"error":"an error occurred"}

  ### inject error
  (!api-request:api-response)

  ### validate error was returned
  (api-request:api-response)

  

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



