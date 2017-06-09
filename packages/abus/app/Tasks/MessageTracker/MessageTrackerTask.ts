import { IMessage } from "../../IMessage";
import { MessageHandlerContext } from "../../MessageHandlerContext";
import { IMessageTask } from "../IMessageTask";
import { ITrackMessages } from "./ITrackMessages";
import { TrackingMessage } from "./TrackingMessage";
import { SyntheticMessage } from "./SyntheticMessage";
import { MetaData } from "../../MetaData";

/**
 * A messaging task that is used to track messages in a hierarchy for easier processing.
 * NB: This tracker should not be used in production as it retains all messages in memory.
 *
 * @export
 * @class TrackMessagesTask
 * @implements {IMessageTask}
 */
export class MessageTrackerTask implements IMessageTask {
    public trackers: ITrackMessages[] = [];
    public static instance: MessageTrackerTask;

    constructor() {
        // Set the instance to the current instance of the task so it can be used by synthetic messages
        MessageTrackerTask.instance = this;
    }
    public async invokeAsync(message: IMessage<any>, context: MessageHandlerContext, next: any) {
        this.trackMessage(message);
        await next();
    }

    private trackMessage(message: IMessage<any>): void {
        for (let i = 0; i < this.trackers.length; i++) {
            this.trackers[i].trackMessageAsync(message);
        }
    }

    /**
     * This method forwards TrackingMessage messages to registered trackers
     * This is used to augment the already tracked messages and provide additional context.
     * 
     * @param {TrackingMessage} message 
     * 
     * @memberOf MessageTrackerTask
     */
    public trackTrackingMessage(message: TrackingMessage) {
        // As the tracking message doesn't have all the details necessary for a traditional message
        // they need to be generated here.

        const trackingMessage = new SyntheticMessage<string>("TrackingMessage");

        trackingMessage.metaData.correlationId = message.correlationId;
        trackingMessage.metaData.startProcessing = message.startProcessing;
        trackingMessage.metaData.endProcessing = message.endProcessing;
        trackingMessage.metaData.add("process", message.process);
        trackingMessage.metaData.add("action", message.action);
        // Add additional meta-data
        let combinedMetaData = { ...message.metaData.internalHash(), ...trackingMessage.metaData.internalHash() };
        trackingMessage.metaData = new MetaData(combinedMetaData);

        // Now track the synthetic message
        this.trackMessage(trackingMessage);
    }
}
