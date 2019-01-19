import { NodeFormatter } from "./NodeFormatter";
import { InMemoryMessageTracker } from "./InMemoryMessageTracker";
import { TrackFilter } from "./TrackFilter";
import { MessageNode } from "./MessageNode";

export class TextTreeViewFormatter extends NodeFormatter {
    constructor(private tracker: InMemoryMessageTracker, filters: TrackFilter[]) {
        super(filters);
    }

    public render() {
        this.tracker.conversations.forEach(node => {
            this.printNode(node, null, "", false);
        });

        console.log(this.display());
    }

    private printNode(node: MessageNode, parentNode: MessageNode, indent: string, last: boolean) {

        const filter = this.getFilterForMessage(node.message, parentNode ? parentNode.message : null);
        if (!filter) {
            console.log("Unable to locate a filter for message:", node.message);
            return;
        }
        this.write(indent);
        if (last) {
            this.write("└╴");
            indent += "  ";
        }
        else {
            this.write("├╴");
            indent += "│ ";
        }

        this.writeLine(`${filter.process()} --> ${filter.action()} (${node.message.metaData.endProcessing - node.message.metaData.startProcessing} ms)`);

        for (let i = 0; i < node.nodes.length; i++) {
            this.printNode(node.nodes[i], node, indent, i === node.nodes.length - 1);
        }
    }

}