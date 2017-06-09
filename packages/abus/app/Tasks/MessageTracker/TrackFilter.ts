import { IMessage } from "../../IMessage";
import { TrackFilterStyle } from "./TrackFilterStyle";

export abstract class TrackFilter {
    constructor() {
        this.styles = new TrackFilterStyle();
    }
    public message: IMessage<any>;
    public parentMessage: IMessage<any>;

    public abstract match(): boolean;
    public abstract process(): string;
    public abstract action(): string;
    public styles: TrackFilterStyle;
}

