import { IMessage } from "../../IMessage";

export class MessageNode {
    message: IMessage<any>;
    nodes: MessageNode[];
}