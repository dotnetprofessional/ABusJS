import { IMessage } from "../../IMessage";
import { TrackFilter } from "./TrackFilter";

export class TrackFormatter {
    private lines: string[] = [];

    constructor(protected filters: TrackFilter[]) {

    }

    protected write(text: string): void {
        this.lines.push(text);
    }

    protected writeLine(text: string): void {
        this.lines.push(text + "\r\n");
    }

    protected display(): string {
        return this.lines.join("");
    }

    protected getFilterForMessage(message: IMessage<any>, parentNode: IMessage<any>): TrackFilter {

        for (let i = 0; i < this.filters.length; i++) {
            const filter = this.filters[i];
            filter.message = message;
            filter.parentMessage = parentNode;
            if (filter.match()) {
                return filter;
            }
        }
        console.log(message.type);

        return null;
    }

}