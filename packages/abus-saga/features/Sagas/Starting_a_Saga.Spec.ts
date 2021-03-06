import { Bus } from "abus";
import { InMemoryKeyValueStore } from "../../src";
import { SagaDemo } from "./samples/SagaDemo";
import { Bubbles } from "abus-bubbles";

// import { DebugLoggingTask } from "../../src/tasks/DebugLoggingTask";

feature(`Starting a Saga
    A Saga is started by sending a specific message type or types as specified
    by the Saga that will create a new Saga instance. These messages should have something
    that can uniquely identify themselves from other instances of the same message type, such
    as an orderId.

    `, () => {
        let bubbles: Bubbles;

        background(``, () => {
            given(`initialize bus`, () => {
                InMemoryKeyValueStore.forceClear();

                bubbles = new Bubbles();
                bubbles.bus.registerHandlers(SagaDemo);
            });
        });

        scenario(`Sending the Saga start message begins a new Saga instance`, () => {
            given(`a Saga is started with the message 'START_SAGA`, () => {
            });

            when(`sending the start message results in the following message flow
                """
                (!start)(started)
            
                start: {"type": "START_SAGA", "payload":{"id":"test1"}}
                started: {"type": "SAGA_STARTED"}
                """
                `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                });

            then(`the saga handler for the start message is executed`, () => {
                bubbles.validate();
            });
        });

        scenario(`Sending a Saga a start message that has already been started`, () => {
            given(`a Saga is started with the message 'START_SAGA`, () => {
            });

            when(`sending the start message for an already started saga results in the following message flow
                """
                (!start)(started)(!start-again)(error)
            
                start: {"type": "START_SAGA", "payload":{"id":"test1"}}
                start-again: {"type": "START_SAGA", "payload":{"id":"test1", "data":"second"}}
                started: {"type": "SAGA_STARTED"}
                error: {"error":"Saga with key Saga.SagaDemo.test1 already exists. Can't start saga twice."}
                """
                `, async () => {
                    await bubbles.executeAsync(stepContext.docString);
                });

            then(`the saga handler for the start message is executed`, () => {
                bubbles.validate();
            });
        });
    });