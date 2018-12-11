import { Bus } from "../../src/Bus";
import { sleep, waitUntilAsync } from "../Utils";
import * as chai from "chai";
import { IMessage } from "../../src/IMessage";
import { IMessageHandlerContext } from "../../src/IMessageHandlerContext";
import { IMessageTask } from "../../src/tasks/IMessageTask";

chai.should();

class ValidatePipelineTask implements IMessageTask {
    async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any): Promise<void> {
        const messageClone = JSON.stringify(message);
        await next();
        if (JSON.stringify(message) !== messageClone) {
            throw new Error(`ValidatePipeline: \n${JSON.stringify(message)}\n${messageClone}`);
        }
    }
}

feature(`Ensure no concurrency issues`, () => {
    let bus: Bus
    const type = "UNIT_TEST";
    let messagesReceived = [];
    let isDone: boolean;

    background(``, () => {
        given(`abus is configured with the ExpressMemoryTransport`, () => {
            bus = new Bus();

            // configure bus
            bus.start();
            // Add additional tasks for the defatul pipeline
            bus.usingRegisteredTransportToMessageType("*")
                .outboundPipeline.useLocalMessagesReceivedTasks(new ValidatePipelineTask).andAlso()
                .inboundPipeline.useLocalMessagesReceivedTasks(new ValidatePipelineTask);

            // configure handler
            bus.subscribe(type, async (message: any) => {
                await sleep(10);
                messagesReceived.push(message);
                if (message.payload === 99) {
                    isDone = true;
                }
            });
            isDone = false;
            messagesReceived = [];
        });
    });

    scenario(`Sending 100 messages are handled without corruption`, () => {
        when(`100 messages of type '${type}' are sent`, async () => {
            for (let i = 0; i < 100; i++) {
                await bus.sendAsync({ type: `${stepContext.values[0]}`, payload: i });
            }
        });

        then(`the registered handler receives the message in its own instance`, async () => {
            // give the system time to process the messages
            await waitUntilAsync(() => isDone, 200);
            messagesReceived.length.should.be.eql(100);
        });
    });
});
