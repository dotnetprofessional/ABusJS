import { IMessage } from "abus";
import { IBubble } from './IBubble';
import { IBubbleResult } from "./IBubbleResult";
export interface IBubbleFlowResult {
    bubble: IBubble;
    actual: IMessage<any>;
    expected: IMessage<any>;
    result: IBubbleResult;
}
