import { Bubbles } from "../../src/bubbles/Bubbles";
import { InMemoryKeyValueStore } from "../../src/sagas/saga";
import { Bus } from "../../src";
import { SagaDemo } from "./samples/SagaDemo";

feature(`Cancelling a Saga

    Saga's can be cancelled by calling the 'complete' method. This will prevent further processing of the
    Saga instance. If a message arrives for the Saga instance that is not one that creates a new instance then
    The SagaNotFound method is called, which if not overriden, will throw and exception.

    NB: All messages that are sent to a Saga must include a suitable Id for the Saga to identify the Saga instance.

    `, () => {
        let bus: Bus;
        let bubbles: Bubbles;

        background(``, () => {
            given(`initialize bus`, () => {
                InMemoryKeyValueStore.forceClear();

                bubbles = new Bubbles();
                bubbles.bus.registerHandlers(SagaDemo);
                // bubbles.bus.usingRegisteredTransportToMessageType("*")
                //     .inboundPipeline.useTransportMessageReceivedTasks(new DebugLoggingTask("inbound:")).andAlso()
                //     .outboundPipeline.useTransportMessageReceivedTasks(new DebugLoggingTask("outbound:"));
            });
        });

        scenario(`Cancelling an already started Saga`, () => {
            given(`a Saga has been started`, () => {
            });

            when(`sending a message to the Saga to cancel the instance
            """
            (start)(saga-started)---(!cancel)---(!process-order)(error)---
        
            saga-started: {"type":"SAGA_STARTED"}
            start: {"type": "START_SAGA", "payload":{"id":"test1"}}
            cancel: {"type": "CANCEL_ORDER", "payload":{"id":"test1"}}
            process-order: {"type":"PROCESS_ORDER", "payload":{"id":"test1"}}
            error: {"error":"Received message type: PROCESS_ORDER, however unable to find Saga instance for key: test1. This may be due to the Saga not being started or being already complete."}
            """
            `, async () => {
                    bubbles.enableTracing();
                    await bubbles.executeAsync(stepContext.docString);
                });

            and(`sending another message to the Saga`, () => {

            });

            then(`the Saga throws an exception `, () => {
                bubbles.validate();
            });
        });

        scenario(`Cancelling a Saga that has not been started`, () => {
            given(`a Saga not been started`, () => {
            });

            when(`sending a message to the Saga that doesn't start the Saga
            """
            (process-order)(error)
        
            process-order: {"type":"PROCESS_ORDER", "payload":{"id":"test1"}}
            error: {"error":"Received message type: PROCESS_ORDER, however unable to find Saga instance for key: test1. This may be due to the Saga not being started or being already complete."}
            """
            `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                });

            then(`the Saga thrown an exception`, () => {
                bubbles.validate();
            });
        });
    });