# Unit Test Results

D:\dev\git.public\ABusJS>npm test

> abus@0.0.1 test D:\dev\git.public\ABusJS
> jest

```
 PASS  Tests\ABus.Subscription.Spec.ts
  Subscriptions
    subscribing to a message type
      √ should register subscriber for the message type (2ms)
      √ should throw Invalid subscription exception for null messageHandler (1ms)
      √ should throw exception for invalid handler
      √ should throw exception for invalid message type (1ms)
      ○ should publish a subscription created message
    unsubscribing to a message type
      √ removes handler from subscription (1ms)
    subscribing to a message sub type
      √ should receive messages for all message types currently registered with supplied type prefix (9ms)
      √ should receive messages for all message types currently registered with supplied type suffix (3ms)
    subscribing to a message with throttling
      ○ should only forward messages once per throttle period
      ○ should receive messages for all message types currently registered with supplied type suffix
  subscribing to a message type using decorators
    using a string literal to define the messageFilter
      √ should register subscriber for the message type (2ms)
      √ should call handler with correct class instance (2ms)
    using the message type to define the messageFilter
      √ should register subscriber for the message type (1ms)
      √ should call handler with correct class instance (2ms)
    using the message type to define the messageFilter that uses inheritance
      √ should register subscriber for the message type (1ms)
      √ should call handler with correct class instance (9ms)
    having multiple handlers using both methods
      √ should register subscriber for the message type (1ms)
      √ should call handlers with correct class instance (1ms)

 PASS  Tests\ABus.Send.Spec.ts
  Send method
    sending a message outside of a handler
      √ should add a messageHandlerContext to the handler receiving message being sent (13ms)
      √ should add messageType to messageHandlerContext
      √ should add messageId to messageHandlerContext
      √ should set the conversationId on messageHandlerContext (1ms)
      √ should set the correlationId on messageHandlerContext to undefined (1ms)
      √ should not add replyTo to messageHandlerContext
      √ should verify there is only one subscriber for message type (1ms)
      √ should throw SubscriberNotFound exception if no subscriber has registered for message type (1ms)
      √ should send to registered subscriber (52ms)
      √ should invoke reply handler after executing message handler (3ms)
    sending a message outside of a handler using derived message
      √ should add a messageHandlerContext to the handler receiving message being sent (12ms)
      √ should add messageType to messageHandlerContext (1ms)
      √ should add messageId to messageHandlerContext
      √ should set the conversationId on messageHandlerContext
      √ should set the correlationId on messageHandlerContext to undefined
      √ should not add replyTo to messageHandlerContext
      √ should send to registered subscriber (52ms)
    sending a message inside of a handler
      √ should send message to all registered subscribers (12ms)
      √ should add a messageHandlerContext to the handler receiving message being sent
      √ should add messageId to messageHandlerContext which differs from original message
      √ should set the conversationId on messageHandlerContext to the same as the original message (1ms)
      √ should set the correlationId on messageHandlerContext to the messageId of the original message
    sending a message inside of a handler using derived message
      √ should send message to all registered subscribers (11ms)
    sending a message inside of a handler using derived message with inheritance
      √ should send message to all registered subscribers (11ms)
    sending a deferred message inside of a handler
      √ should send deferred message to all registered subscribers after time interval (113ms)

 PASS  Tests\InMemoryStorageQueue.Spec.ts
  Adding a message to the queue
    √ should increment the message count on queue by 1
    √ should set the message type to the supplied type (1ms)
    √ should set the message timestamp to the current time
    √ should set the messageId to a unique Guid (1ms)
    √ should set the deliverAt to zero meaning to deliver immediately
  Getting a message from the queue
    √ should return the message
    √ make the message unavailable to other consumers for the configured lease period (1ms)
    √ should return the message back to the queue after the lease period has completed (60ms)
    √ should set the dequeue count to 1 when first dequeued
    √ should increment the dequeue count on each subsequent dequeue (2ms)
  Completing a message
    √ should remove the message permanently from the queue
    √ should reduce the message count by 1
  Abandoning a message
    √ should return the message back to the queue immediately
  Renewing a message lease
    √ should extend the time the message is leased (not available) for the time period specified (32ms)
  Adding an onMessage handler
    √ should provide new messages added to queue (4ms)
    √ should provide deferred messages when the time up expires (50ms)
  Peeking a message
    √ should return the next available message (2ms)
    √ should not prevent the message from being returned by a getMessage call

 PASS  Tests\ABus.Publish.Spec.ts
  Publish method
    ○ should not send the message if the timeout has been reached for a persisted message
    publishing a message outside of a handler
      √ should send message to all registered subscribers (3ms)
      √ should add a messageHandlerContext to the handler receiving message being sent (1ms)
      √ should add messageType to messageHandlerContext (1ms)
      √ should add messageId to messageHandlerContext
      √ should set the conversationId on messageHandlerContext (1ms)
      √ should set the correlationId on messageHandlerContext to undefined
      √ should be fully async and return before subscribers have processed the message (34ms)
      √ should not throw an exception if subscriber throws an exception (14ms)
    publishing a message inside of a handler
      √ should send message to all registered subscribers (12ms)
      √ should add a messageHandlerContext to the handler receiving message being sent (1ms)
      √ should add messageId to messageHandlerContext which differs from original message
      √ should set the conversationId on messageHandlerContext to the same as the original message
      √ should set the correlationId on messageHandlerContext to the messageId of the original message (1ms)
    publishing a message inside of a handler using derived message
      √ should send message to all registered subscribers (11ms)
    publishing a message inside of a handler using derived message with inheritance
      √ should send message to all registered subscribers (11ms)

 PASS  Tests\ABus.MessageTask.Spec.ts
  Message Task
    Adding a message task to pipeline with Sync handlers
      √ should execute code before and after calling next() (15ms)
    Adding a message task to pipeline with Async handlers
      √ should execute code before and after calling next() (13ms)

 PASS  Tests\hashtable.spec.ts
  Creating instance
    √ should support generic types (1ms)
  Adding an item to a hashtable
    √ should increase the count by 1
    √ should allow the retrieval of the value by key
    √ should contain the key (1ms)
    √ should throw duplicate exception if key already exists
    √ should include the new item in keys collection
    √ should be returned in for .. in
  Removing an item from a hashtable
    √ should decrease the count by 1
    √ should disallow the retrieval of the value by key
    √ should not contain the key
    √ should not contain item in keys collection
  Clearing the hashtable
    √ should have a count of 0 (1ms)
    √ should have no values for the keys collection (1ms)
  Updating an item to a hashtable
    √ should add the item if not found (1ms)
    √ should update the item if already exist

 PASS  Tests\LocalTransport.Spec.ts
  subscribing to a message type
    √ should register subscriber for the message type
    √ should throw Invalid subscription name exception for null name
    √ should throw exception for invalid message filter
    √ should throw exception when subscription name already exists (1ms)
  unsubscribing to a message type
    √ removes handler from subscription (1ms)
  subscribing to a message sub type
    √ should receive messages for all message types currently registered with supplied type prefix (2ms)
    √ should receive messages for all message types currently registered with supplied type suffix (1ms)
  multiple subscribers to a message
    √ should receive messages for all message types currently registered with supplied type prefix (1ms)
    √ should receive messages for all message types currently registered with supplied type suffix (3ms)

 PASS  Tests\timespan.Spec.ts
  Creating a time span of 1 day
    √ should return 1 for days()
    √ should return 24 for totalHours()
    √ should return 1,440 for totalMinutes() (1ms)
    √ should return 86,400 for totalSeconds()
    √ should return 86400000 for totalMilliseconds() (1ms)

Test Suites: 2 skipped, 8 passed, 8 of 10 total
Tests:       7 skipped, 104 passed, 111 total
Snapshots:   0 total
Time:        4.642s
Ran all test suites.
```