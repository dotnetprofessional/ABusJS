import { TrackFormatter } from "./TrackFormatter";

export abstract class NodeFormatter extends TrackFormatter {
    public abstract render();
}

