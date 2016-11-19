import {
    MessagePipeline,
    MessageHandlerContext,
    IMessage,
    IMessageSubscription,
    IMessageHandlerContext,
    MessageHandlerOptions,
    ThreadingOptions,
    IMessageTask,
    Utils
} from '../ABus';

import * as testData from './ABus.Sample.Messages'

class TestMessageTask implements IMessageTask {
    private _counter:number = 0;

    async invokeAsync(message: IMessage<any>, context: MessageHandlerContext, next: Promise<void>) {
        this._counter ++;
        await next;
        debugger;
        this._counter ++;
    }

    reset() {
        this._counter = 0;
    }

    get counter() {
        return this._counter;
    }
}

describe("Adding a message task to pipeline with Sync handlers", () => {
    var pipeline = new MessagePipeline();
    var returnedMessage: testData.CustomerData;
    var currentHandlerContext: IMessageHandlerContext;
    var counter = 0;
    var messageTask = new TestMessageTask();

    pipeline.messageTasks.clear();
    pipeline.messageTasks.add(messageTask);

    pipeline.subscribe({
        messageType: testData.TestMessage.TYPE,
        handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
            returnedMessage = message;
            currentHandlerContext = context;
            counter ++;
        }
    });

    it("should execute code before and after calling next()", () => {
        messageTask.reset();
        expect(messageTask.counter).toBe(0);
        pipeline.publish(new testData.TestMessage("Johhny Smith"));
        expect(messageTask.counter).toBe(2);
    });
});

describe("Adding a message task to pipeline with Async handlers", () => {
    var pipeline = new MessagePipeline();
    var returnedMessage: testData.CustomerData;
    var currentHandlerContext: IMessageHandlerContext;
    var counter = 0;
    var messageTask = new TestMessageTask();

    pipeline.messageTasks.clear();
    pipeline.messageTasks.add(messageTask);

    pipeline.subscribe({
        messageType: testData.TestMessage.TYPE,
        handler: async (message: testData.CustomerData, context: MessageHandlerContext) => {
            returnedMessage = message;
            currentHandlerContext = context;
            await Utils.sleep(30);
            console.log('Just finished sleeping.');
            counter ++;
        }
    });

/*
*    should execute code before calling next() 
*    should execute code after calling next()
*/
    it("should execute code before and after calling next()", () => {
        messageTask.reset();
        expect(messageTask.counter).toBe(0);
        pipeline.publish(new testData.TestMessage("Johhny Smith"));
        expect(counter).toBe(1);
        expect(messageTask.counter).toBe(2);
    });
});