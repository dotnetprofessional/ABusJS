import { LocalTransport } from "../app/LocalTransport";
import { IMessage } from "../app/IMessage";
import { Bus } from "../app/Bus";
import { MessageHandlerContext } from "../app/MessageHandlerContext";

import * as testData from "./ABus.Sample.Messages";


export class PerformanceHandler {

    private bus: Bus;

    constructor(public iterations: number) {
        this.handler = this.handler.bind(this);
        this.handler2 = this.handler2.bind(this);
        this.subscribeHandler1 = this.subscribeHandler1.bind(this);
        this.subscribeHandler2 = this.subscribeHandler2.bind(this);
        this.bus = Bus.instance;
        this.bus.unregisterAll();
    }

    public startTime: number;
    public endTime: number;
    public elapsedTime(): number {
        return this.endTime - this.startTime / 1000;
    }
    public start() {
        this.startTime = Date.now();
    }

    public stop() {
        this.endTime = Date.now();
    }


    public operationsPerSec(): number {
        return this.iterations / (this.endTime - this.startTime) * 1000
    }

    public subscribeHandler1() {
        this.bus.subscribe({ messageFilter: testData.TestMessage.TYPE, handler: this.handler });
    }

    public subscribeHandler2() {
        this.bus.subscribe({ messageFilter: testData.TestMessage.TYPE, handler: this.handler2 });

    }
    public counter = 0;

    async handler(message: testData.TestMessage, context: MessageHandlerContext) {
        this.counter++;
    };

    handler2(message: testData.TestMessage, context: MessageHandlerContext) {
        this.counter++;
    }
}

describe.skip("LocalTransport", () => {

    describe.skip("Sending an receiving messages", () => {
        var transport = new LocalTransport();

        it("should be fast!", () => {
            let counter = 0;
            transport.subscribe("test", "test.*")
            let timerStart = new Date().getTime();
            let timerEnd = 0;
            transport.onMessage((message: IMessage<any>) => {
                counter++;
                if (counter === 1000) {
                    timerEnd = new Date().getTime();
                }
            });

            for (let i = 0; i < 1000; i++) {
                transport.send({ type: testData.TestMessage.TYPE, message: {} });
            }

            let elapsed = timerEnd - timerStart;
            expect(counter).toBe(1000);
            expect(elapsed).toBeLessThan(100);
        });

    });
})

describe.skip("abus", () => {
    let iterations = 1000;
    describe("Sending 1000 message via SendAsync", () => {
        // NB: Even though this is skipped any code here will get executed
        //     so all intensive code must live in an 'it' function.
        it("should execute in under x ms", () => {
            var p = new PerformanceHandler(iterations);
            let bus = Bus.instance;
            p.subscribeHandler1();

            p.start();
            for (let i = 0; i < iterations; i++) {
                bus.sendAsync(new testData.TestMessage(""))
            }
            p.stop();
            console.log("operations: " + p.operationsPerSec());
        })
    })

})

