import { IMessage, Intents, IMessageTracing } from "abus2";

/**
 * Provides a set of diagrams based on the mermaid diagramming language
 *
 * @export
 * @class Mermaid
 */
export class Mermaid {
    // public flowDiagram(): string {
    //     let output = "graph TD\n";

    //     // define the processes
    //     const processes: Set<string> = new Set();
    //     this.bubbleFlowResult.forEach(bubble => {
    //         if (bubble.actual.metaData.receivedBy) {
    //             processes.add(bubble.actual.metaData.receivedBy);
    //         }
    //     });

    //     processes.forEach(process => {
    //         // at this point can add styles too
    //         output += "\n" + process;
    //     });

    //     // associate messages with processes
    //     this.bubbleFlowResult.forEach(bubble => {
    //         const actual = bubble.actual;
    //         // lookup the parent process based on the correlationId
    //         const parentProcessIdentifier = this.getParentIdentifier(bubble);
    //         let event: string;
    //         if (actual.metaData.intent === Intents.reply) {
    //             actual.metaData.receivedBy = this.getParentIdentifier(this.getParentMessage(bubble));
    //             event = `${parentProcessIdentifier} -.-> |${actual.type}| ${actual.metaData.receivedBy || "unhandled"}`;
    //         } else {
    //             event = `${parentProcessIdentifier} --> |${actual.type}| ${actual.metaData.receivedBy || "unhandled"}`;
    //         }

    //         // at this point can add syles too
    //         output += "\n" + event;
    //     });

    //     return output;
    // }

    public sequenceDiagram(messages: IMessage<any>[]): string {
        let output: string = "sequenceDiagram\nparticipant start";

        // define the processes
        const processes: Set<string> = new Set();
        messages.forEach(message => {
            if (message.metaData.receivedBy) {
                processes.add(message.metaData.receivedBy);
            }
        });

        processes.forEach(process => {
            // at this point can add styles too
            output += "\nparticipant " + process;
        });

        // associate messages with processes
        messages.forEach(message => {
            // lookup the parent process based on the correlationId
            const parentMessage: IMessage<any> = this.getParentMessage(message, messages);
            const processName: string = parentMessage.metaData.receivedBy || "start";

            let event: string;
            // at this point can add styles too
            if (message.metaData.intent === Intents.reply) {
                message.metaData.receivedBy = this.getParentMessage(parentMessage, messages).metaData.receivedBy;
                event = `${processName}-->>${message.metaData.receivedBy || "unhandled"}:${message.type}`;
            } else {
                event = `${processName}->>${message.metaData.receivedBy || "unhandled"}:${message.type}`;

            }

            output += "\n" + event;
        });

        return output;
    }

    private getParentMessage(message: IMessage<any>, allMessages: IMessage<any>[]): IMessage<any> {
        const parentProcess: IMessage<any>[] = allMessages.filter(
            m => (m.metaData as IMessageTracing).messageId === (m.metaData as IMessageTracing).correlationId);
        return parentProcess[0];
    }
}