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