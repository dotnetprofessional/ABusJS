import { Bus } from '../App/Bus'
import { MessageHandlerContext } from '../App/MessageHandlerContext'
import { IMessage } from '../App/IMessage'
import { Utils } from '../App/Utils'
import { IMessageTask } from '../App/Tasks/IMessageTask'

import * as testData from './ABus.Sample.Messages'

class TestMessageTask implements IMessageTask {
    private _counter: number = 0;

    constructor(private log: string[]) {

    }
    async invokeAsync(message: IMessage<any>, context: MessageHandlerContext, next: any) {
        this._counter++;
        this.log.push('TestMessageTask: before next');
        await next();
        this.log.push('TestMessageTask: after next');
        this._counter++;
    }

    reset() {
        this._counter = 0;
    }

    get counter() {
        return this._counter;
    }

    get logs() {
        return this.log;
    }
}

describe("Message Task", () => {

    describe("Adding a message task to pipeline with Sync handlers", () => {
        var pipeline = new Bus();
        var returnedMessage: testData.CustomerData;
        var currentHandlerContext: MessageHandlerContext;
        var counter = 0;
        var logs = [];
        var messageTask = new TestMessageTask(logs);

        pipeline.inBoundMessageTasks.clear();
        pipeline.inBoundMessageTasks.add(messageTask);

        pipeline.subscribe({
            messageFilter: testData.TestMessage.TYPE,
            handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
                returnedMessage = message;
                currentHandlerContext = context;
                counter++;
                logs.push('Handler: added 1 to counter');
            }
        });

        it("should execute code before and after calling next()", async () => {
            messageTask.reset();
            messageTask.counter.should.equal(0);
            pipeline.publish(new testData.TestMessage("Task Sync Handler"));
            // Need to wait for the pipeline to complete
            await Utils.sleep(10);

            logs.length.should.be.equal(3);
            counter.should.be.equal(1);
            messageTask.counter.should.be.equal(2);
        });
    });

    describe("Adding a message task to pipeline with Async handlers", () => {
        var pipeline = new Bus();
        var returnedMessage: testData.CustomerData;
        var currentHandlerContext: MessageHandlerContext;
        var counter = 0;
        var logs = [];
        var messageTask = new TestMessageTask(logs);

        pipeline.inBoundMessageTasks.clear();
        pipeline.inBoundMessageTasks.add(messageTask);

        pipeline.subscribe({
            messageFilter: testData.TestMessage.TYPE,
            handler: async (message: testData.CustomerData, context: MessageHandlerContext) => {
                returnedMessage = message;
                currentHandlerContext = context;
                await Utils.sleep(10);
                logs.push('Handler: added 1 to counter');
                counter++;
            }
        });

        /*
        *    should execute code before calling next()
        *    should execute code after calling next()
        */
        it("should execute code before and after calling next()", async () => {
            messageTask.reset();
            messageTask.counter.should.be.equal(0);
            pipeline.publish(new testData.TestMessage("Task Async Handler"));
            await Utils.sleep(10);
            logs.length.should.be.equal(3);
            counter.should.be.equal(1);
            messageTask.counter.should.be.equal(2);
        });
    });

});