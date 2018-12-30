import { BubbleType, BubbleSource } from "./Bubbles";
import { IMessage } from "../IMessage";

export interface IBubble {
    type: BubbleType;
    source: BubbleSource;
    name: string;
}

export interface IDelayBubble extends IBubble {
    delay: number;
}

export interface IBubbleFlowResult {
    bubble: IBubble;
    actual: IMessage<any>;
    expected: IMessage<any>;
    result: IBubbleResult;
}

export interface IBubbleResult {
    isValid: boolean;
    diff: string;
}