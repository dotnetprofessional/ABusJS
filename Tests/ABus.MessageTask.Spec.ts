import {Bus} from '../ABus'
import {MessageHandlerContext} from '../MessageHandlerContext'
import {IMessage} from '../IMessage'
import {IMessageSubscription} from '../IMessageSubscription'
import {IMessageHandlerContext} from '../IMessageHandlerContext'
import {MessageHandlerOptions, ThreadingOptions} from '../MessageHandlerOptions'
import {Utils} from '../Utils'

import {
        IMessageTask,
} from '../Tasks/messageTasks' 

import * as testData from './ABus.Sample.Messages'


class TestMessageTask implements IMessageTask {
    private _counter:number = 0;

    constructor(private log: string[]){

    }
    invoke(message: IMessage<any>, context: MessageHandlerContext, next: any) {
        this._counter ++;
        this.log.push('TestMessageTask: before next');
        next();
        this.log.push('TestMessageTask: after next');
        this._counter ++;
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

describe.skip("Adding a message task to pipeline with Sync handlers", () => {
    var pipeline = new Bus();
    var returnedMessage: testData.CustomerData;
    var currentHandlerContext: IMessageHandlerContext;
    var counter = 0;
    var logs = [];
    var messageTask = new TestMessageTask(logs);

    pipeline.messageTasks.clear();
    pipeline.messageTasks.add(messageTask);

    pipeline.subscribe({
        messageFilter: testData.TestMessage.TYPE,
        handler: (message: testData.CustomerData, context: MessageHandlerContext) => {
            returnedMessage = message;
            currentHandlerContext = context;
            counter ++;
            logs.push('Handler: added 1 to counter');
        }
    });

    it("should execute code before and after calling next()", () => {
        messageTask.reset();
        expect(messageTask.counter).toBe(0);
        pipeline.publish(new testData.TestMessage("Johhny Smith"));
        expect(logs.length).toBe(3);
        expect(counter).toBe(1);
        expect(messageTask.counter).toBe(2);
    });
});

describe.skip("Adding a message task to pipeline with Async handlers", () => {
    var pipeline = new Bus();
    var returnedMessage: testData.CustomerData;
    var currentHandlerContext: IMessageHandlerContext;
    var counter = 0;
    var logs =[];
    var messageTask = new TestMessageTask(logs);

    pipeline.messageTasks.clear();
    pipeline.messageTasks.add(messageTask);

    pipeline.subscribe({
        messageFilter: testData.TestMessage.TYPE,
        handler: async  (message: testData.CustomerData, context: MessageHandlerContext) => {
            returnedMessage = message;
            currentHandlerContext = context;
            await Utils.sleep(10);
            logs.push('Handler: added 1 to counter');
            counter ++;
        }
    });

/*
*    should execute code before calling next() 
*    should execute code after calling next()
*/
    it("should execute code before and after calling next()", async () => {
        messageTask.reset();
        expect(messageTask.counter).toBe(0);
        pipeline.publish(new testData.TestMessage("Johhny Smith"));
        await Utils.sleep(100);
        expect(logs.length).toBe(3);
        expect(counter).toBe(1);
        expect(messageTask.counter).toBe(2);
    });
});