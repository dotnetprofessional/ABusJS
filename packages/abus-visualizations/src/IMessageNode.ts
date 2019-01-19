import { IMessage } from "abus2";
export interface IMessageNode {
    message: IMessage<any>;
    nodes: IMessageNode[];
}
