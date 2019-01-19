import { IMessage, IMessageTracing } from "abus2";
import { IMessageNode } from "./IMessageNode";

export class Convert {
    public toTreeStructure(messages: IMessage<any>[]): IMessageNode[] {
        const nodes: object = {};
        const rootNodes: IMessageNode[] = [];

        for (let i: number = 0; i < messages.length; i++) {
            const m: IMessage<any> = messages[i];
            const messageNode: IMessageNode = { message: m, nodes: [] };
            let parentNode: IMessageNode = nodes[(m.metaData as IMessageTracing).correlationId];
            if (!parentNode) {
                nodes[m.metaData.messageId] = messageNode;
                rootNodes.push(messageNode);
            } else {
                parentNode.nodes.push(messageNode);
            }
        }
        return rootNodes;
    }
}