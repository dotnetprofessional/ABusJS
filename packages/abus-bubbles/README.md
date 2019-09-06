![Bubbles](docs/images/bubbles-logo.png)

Bubbles is a library to make testing the ABus message system much easier. Its inspired by the [marble diagrams](http://reactivex.io/rxjs/manual/overview.html#marble-diagrams) used by Rx. It does this by providing a declarative language to specify a message flow. Each of the messages within the flow can then be defined further to ensure the correct message data occurred.

## What does it look like?
Given a reasonably complex message flow for an imaginary agreement process, as shown below.

![Sample Process](https://github.com/dotnetprofessional/ABusJS/raw/dnp/abus-2/packages/abus-bubbles/docs/images/sequence-diagram.PNG)

It would be fairly difficult to validate this message flow and the message content. However, with Bubbles this can be done with the following [livedoc-mocha](https://github.com/dotnetprofessional/LiveDoc/tree/master/packages/livedoc-mocha#readme) test.

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

The key point about this example is that the actual test code is literally two lines. The test is validating the entire process flow and the message content within it.

> The sample here uses the [livedoc-mocha](https://github.com/dotnetprofessional/LiveDoc/tree/master/packages/livedoc-mocha#readme) testing library.

Refer to the full [API documentation](docs/Bubbles.md) for more details.