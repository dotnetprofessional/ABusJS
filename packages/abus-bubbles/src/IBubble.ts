import { BubbleIntent } from "./BubbleIntent";
import { BubbleSource } from "./BubbleSource";
export interface IBubble {
    intent: BubbleIntent;
    source: BubbleSource;
    name: string;
}
