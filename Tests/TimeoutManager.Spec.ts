import {TimeoutManager} from '../TimeoutManager';
import TimeSpan from '../TimeSpan'
import * as testData from './ABus.Sample.Messages'
import * as ABus from '../ABus';

describe.skip("Deferring a message", () => {
    let bus = new ABus.Bus();
    let counter = 0;
    let timeoutManager = new TimeoutManager(bus);
    let messageHandlerContext = new ABus.MessageHandlerContext(bus);
    messageHandlerContext.messageId = ABus.Guid.newGuid();

    jest.useFakeTimers();

    bus.subscribe({messageType: testData.TestMessage.TYPE, 
            handler: (message: testData.TestMessage, context: ABus.MessageHandlerContext)=>{
        counter = 100;
    }});

    it("should send the message at the specified time", () => {
        timeoutManager.deferMessage(new testData.TestMessage("test"), messageHandlerContext, 
            {deliverAt: TimeSpan.FromSeconds(4).getDateTime()});

        expect(counter).toBe(0);

        // Wait awhile and check the message still hasn't been sent
        jest.runTimersToTime(TimeSpan.FromSeconds(3).totalMilliseconds);
        expect(counter).toBe(0);
        // Now wait enough time to fire the send
        jest.runTimersToTime(TimeSpan.FromSeconds(1).totalMilliseconds);
        expect(counter).toBe(100);
    });

    it.skip("should not send the message if the timeout has been reached for a persisted message", () => {
        // This test only makes sense once persistent timers have been implemented.
    });

})