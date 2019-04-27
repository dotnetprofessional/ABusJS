import { IPersistDocuments, InMemoryKeyValueStore } from "../../src";
import { IOrderProcessModel, OrderProcess, ProcessOrderCommand } from './Samples/OrderProcess';
import { IBus, Bus, getTypeNamespace } from 'abus';
import { expect } from 'chai';
import { sleep } from '../Utils';
import { Bubbles } from 'abus-bubbles';
const should = require("chai").should();

feature(`Process persists data`, () => {
    let storage: IPersistDocuments<IOrderProcessModel>;
    let process: OrderProcess;
    let bus: IBus;

    background(``, () => {
        given(`a process accepts the message 'PROCESS-ORDER'`, () => {
            storage = new InMemoryKeyValueStore<IOrderProcessModel>();
            InMemoryKeyValueStore.forceClear();
            process = new OrderProcess();

            bus = new Bus();
            bus.start();
            bus.registerHandlers(process);
        });
    });

    scenario(`Handling a message successfully stores any mutated state`, () => {
        when(`creating an order`, async () => {
            bus.sendAsync(new ProcessOrderCommand("12345"));
            // message needs time to execute
            await sleep(10);
        });

        then(`the order count is incremented`, async () => {
            const key = getTypeNamespace(process);
            const result = await storage.getAsync(key);
            result.data.processedOrders.length.should.eq(1);
        });
    });

    scenario(`A failed handler discards any state mutations ie does a rollback`, () => {
        when(`creating an order`, async () => {
            bus.sendAsync(new ProcessOrderCommand("error"));
            // message needs time to execute
            await sleep(20);
        });

        then(`the order count is not incremented`, async () => {
            const key = getTypeNamespace(process);
            const result = await storage.getAsync(key);
            expect(result.data).to.be.undefined;
        });
    });

    scenario(`A failed handler publishes a Bus.Error message`, () => {
        let bubbles: Bubbles;


        when(`creating an order that fails
            """
            (!order)(error)

            order: {"type": "ProcessOrderCommand", "payload": {"orderId" : "error"} }
            error: {"error": "Something bad happened!"}
            """
            `, async () => {
                bubbles = new Bubbles(bus);
                await bubbles.executeAsync(stepContext.docString);
            });

        then(`the error should have been posted to the bus`, async () => {
            bubbles.validate();
        });
    });
});