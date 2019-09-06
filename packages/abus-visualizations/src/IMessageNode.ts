import { IMessage } from "abus";
export interface IMessageNode {
    message: IMessage<any>;
    nodes: IMessageNode[];
}
