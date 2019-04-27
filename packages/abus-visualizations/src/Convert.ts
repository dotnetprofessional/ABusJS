import { IMessage, IMessageTracing, Intents } from "abus";
import { IMessageNode } from "./IMessageNode";

export class Convert {
    public toTreeStructure(messages: IMessage<any>[]): IMessageNode[] {
        const nodes: object = {};
        const rootNodes: IMessageNode[] = [];

        for (let i: number = 0; i < messages.length; i++) {
            const m: IMessage<any> = messages[i];
            const messageNode: IMessageNode = { message: m, nodes: [] };
            let parentNode: IMessageNode;
            if (m.metaData.intent === Intents.reply) {
                parentNode = nodes[(m.metaData as IMessageTracing).replyTo];
            } else {
                parentNode = nodes[(m.metaData as IMessageTracing).correlationId];
            }

            nodes[m.metaData.messageId] = messageNode;
            if (!parentNode) {
                rootNodes.push(messageNode);
            } else {
                parentNode.nodes.push(messageNode);
            }
        }
        return rootNodes;
    }
}