import { BubbleType } from "./BubbleType";
import { BubbleSource } from "./BubbleSource";
export interface IBubble {
    type: BubbleType;
    source: BubbleSource;
    name: string;
}
