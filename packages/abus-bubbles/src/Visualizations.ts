import { Mermaid, TextVisualizations } from "abus-visualizations";
import { Bubbles } from "./Bubbles";

/**
 * Provides various ways to visualize the observed message flows.
 *
 * @export
 * @class Visualizations
 */
export class Visualizations {
    constructor(protected bubbles: Bubbles) {

    }

    public toProcessDiagram(): string {
        const mermaid: Mermaid = new Mermaid();
        return mermaid.processFlowDiagram(this.bubbles.observedMessages());
    }

    public toSequenceDiagram(): string {
        const mermaid: Mermaid = new Mermaid();
        return mermaid.sequenceDiagram(this.bubbles.observedMessages());
    }

    public printAsciiTree(): void {
        const text: TextVisualizations = new TextVisualizations();
        console.log(text.tree(this.bubbles.observedMessages()));
    }
}
