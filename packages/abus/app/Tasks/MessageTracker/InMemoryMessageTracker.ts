import { IMessage } from "../../IMessage";
import { ITrackMessages } from "./ITrackMessages";
import { MessageNode } from "./MessageNode";
/**
 * A messaging task that is used to track messages in a hierarchy for easier processing.
 * NB: This tracker should not be used in production as it retains all messages in memory.
 *
 * @export
 * @class TrackMessagesTask
 * @implements {IMessageTask}
 */
export class InMemoryMessageTracker implements ITrackMessages {
    // an object type is used to act as a simulated cache for fast look up
    public conversations: MessageNode[] = [];
    private processedNodes: any = {};

    public async trackMessageAsync(message: IMessage<any>) {
        let node: MessageNode = { message, nodes: [] };

        // Check if this message's parent has been processed
        let parent = this.processedNodes[message.metaData.correlationId] as MessageNode;
        if (parent) {
            // parent found so add this message to the collection of messages for the parent
            parent.nodes.push(node);
        } else {
            // This message has no parent which means it must be a root node so add it to the list
            // of conversations which represent root nodes.
            this.conversations.push(node);
        }

        // Record each message so that its easy to find it later
        this.processedNodes[message.metaData.messageId] = node;
    }

    public clear() {
        this.conversations = [];
        this.processedNodes = {};
    }
}

