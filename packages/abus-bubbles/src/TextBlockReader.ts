export class TextBlockReader {
    private arrayOfLines: string[];
    private currentIndex: number = -1;
    constructor(text: string) {
        // Split text into lines for processing
        this.arrayOfLines = text.split(/\r?\n/);
    }
    public get count() {
        return this.arrayOfLines.length;
    }
    public get line(): string {
        if (this.currentIndex < this.count) {
            const line = this.arrayOfLines[this.currentIndex];
            return (line || "").trim();
        }
        else {
            return null;
        }
    }

    public next(): boolean {
        this.currentIndex++;
        return this.currentIndex >= 0 && this.currentIndex < this.count;
    }

    public get nextBlock(): string {
        const lines = [];
        let isNext = this.next();
        while (isNext && (this.line && this.line.length > 0)) {
            lines.push(this.line);
            isNext = this.next();
        }
        return lines.join("\n");
    }
    public reset(): void {
        this.currentIndex = -1;
    }
}
