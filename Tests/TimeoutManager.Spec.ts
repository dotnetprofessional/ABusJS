import {TimeoutManager} from '../TimeoutManager';
import TimeSpan from '../TimeSpan'
import * as testData from './ABus.Sample.Messages'
import * as ABus from '../ABus';

describe("Deferring a message", () => {
    let timespan = new TimeSpan(1, 0, 0, 0, 0);
    let pipeline = new ABus.MessagePipeline();
    let counter = 0;

    jest.useFakeTimers();

    pipeline.subscribe({messageType: testData.TestMessage.TYPE, 
            handler: (message: testData.TestMessage, bus: ABus.MessageHandlerContext)=>{
        counter = 100;
    }});

    it("should send the message at the specified time", () => {
        pipeline.send(new testData.TestMessage("test"), {deliverIn: TimeSpan.FromSeconds(5)});
        expect(counter).toBe(0);

        expect(setTimeout.mock.calls.length).toBe(1);
        // fast-forward timers
        jest.runAllTicks
    });

    it("should not send the message if the timeout has been reached", () => {
        expect(timespan.totalHours).toBe(24);
    });

})