# ABus
_A transport agnostic messaging API for javascript_

ABus provides a simplified messaging API that can be used against multiple message transports such as in memory, ws-sockets and signalR etc.
This provides the flexibility to deliver messages to different receivers while maintaining the same api interface. ABus also
provides a unified and consistent way of handling the key aspects of an enterprise messaging solution in javascript:

## Transports
Transports are the underlying technology used to move a message from point A to point B. Supported transports will include,
InMemory, signalR, ws-sockets, multi-thread such as web workers in browsers and separate threads for native, with others to follow depending on needs.

## Messaging Patterns
Different transports provide support for messaging patterns in a number of ways. ABus serves to provide a simple and consistent way of handling
the following standard messaging patterns, without having to understand the specific details of the underlying transport:

* Request/response
* Command – fire and forget
* Events – aka publish and subscribe

## Sagas
A Saga is a distribution of long-living transactions where steps may interleave, each with associated compensating transactions providing a
compensation path across persistent stores in the occurrence of a fault that may or may not compensate the entire chain back to the originator. This
pattern is based off the paper written by Hector Garcia-Molina in 1987. In short saga’s provide an alternative to a typical workflow pattern.

## Automatic retries
Failures happen and in a cloud environment and on the client and they happen often, however they are also quite often transient in nature. First level
automatic retries attempt to resolve these issues by retrying the message immediately, while second level retries offer protection for more intermediate
failures, and will continue to retry for minutes or hours depending on the needs. These reties are handled automatically and provide a more robust system
out of the box.

## Error Handling
Robust error handling ensures that when an error occurs the message is returned to the queue. In the process the infrastructure also handles annotating
the troubled message with details of the exception which allows for easier troubleshooting.

## Monitoring
Having a reliable messaging system isn’t enough, it’s important to be able to monitor in near-real time how messages are flowing or not flowing
through your system. Monitoring aspects of ABus allow for alerts and failure detection through a developers dashboard. Monitoring also allows
the ability to diagram the workflow used by a particular transaction which can highlight issues with application logic.

## Extensibility
The needs of each system are different, so it’s important to be able to customize the message pipeline to support the needs of your system.
ABus supports a fully customizable pipeline architecture with two independent pipelines for inbound and outbound messages. This allows
a system to hook into any part of the messaging pipeline and provide their own additions or substitutions.