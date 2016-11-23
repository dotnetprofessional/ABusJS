import {TimeoutManager} from '../TimeoutManager';
import TimeSpan from '../TimeSpan'
import * as testData from './ABus.Sample.Messages'
import * as ABus from '../ABus';

describe("Deferring a message", () => {
    let pipeline = new ABus.MessagePipeline();
    let counter = 0;
    let timeoutManager = new TimeoutManager(pipeline);

    jest.useFakeTimers();

    pipeline.subscribe({messageType: testData.TestMessage.TYPE, 
            handler: (message: testData.TestMessage, bus: ABus.MessageHandlerContext)=>{
        counter = 100;
    }});

    it("should send the message at the specified time", () => {
        timeoutManager.deferMessage(new testData.TestMessage("test"), null, {deliverAt: TimeSpan.FromSeconds(5).getDateTime()})
        expect(counter).toBe(0);

        jest.runTimersToTime(3000);
        expect(counter).toBe(0);
        jest.runAllTimers();
        expect(counter).toBe(100);
    });

    it.skip("should not send the message if the timeout has been reached", () => {
        //expect(TimeSpan.totalHours).toBe(24);
    });

})