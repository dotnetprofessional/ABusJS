import { IMessage, IMessageTracing } from "abus2";
import { Convert } from "./Convert";
import { IMessageNode } from "./IMessageNode";

export class TextVisualizations {
    public tree(messages: IMessage<any>[]): string {
        // convert linear message flow to a tree structure for easier traversal
        const nodes: IMessageNode[] = new Convert().toTreeStructure(messages);
        const logger: Logger = new Logger();

        logger.writeLine("start");
        for (let i: number = 0; i < nodes.length; i++) {
            this.printNode(logger, nodes[i], "", i === nodes.length - 1);
        }

        return logger.toString();
    }

    private printNode(logger: Logger, tree: IMessageNode, indent: string, last: boolean): void {
        const metaData: IMessageTracing = tree.message.metaData as IMessageTracing;
        const duration: number = metaData.endProcessing - metaData.startProcessing;
        let durationDisplay: string = "";
        if (!isNaN(duration)) {
            durationDisplay = `(${duration}ms)`;
        }
        logger.writeLine(indent + (last ? "└╴ " : "├╴ ") + tree.message.type + ` ${durationDisplay}`);
        indent += last ? "   " : "│  ";

        for (let i: number = 0; i < tree.nodes.length; i++) {
            this.printNode(logger, tree.nodes[i], indent, i === tree.nodes.length - 1);
        }
    }
}

class Logger {
    private lines: string[] = [];

    public write(text: string): void {
        this.lines.push(text);
    }

    public writeLine(text: string): void {
        this.write(text + "\n");
    }

    public toString(): string {
        return this.lines.join("");
    }
}