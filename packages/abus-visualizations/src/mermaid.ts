import { IMessage, Intents, IMessageTracing } from "abus2";

/**
 * Provides a set of diagrams based on the mermaid diagramming language
 *
 * @export
 * @class Mermaid
 */
export class Mermaid {
    public processFlowDiagram(messages: IMessage<any>[]): string {
        let output: string = "graph TD\n";

        // define the processes
        const processes: Set<string> = this.getProcessesFromMessages(messages);

        processes.forEach(process => {
            // at this point can add styles too
            output += "\n" + process;
        });

        // associate messages with processes
        messages.forEach(message => {
            // lookup the parent process based on the correlationId
            const parentMessage: IMessage<any> = this.getParentMessage(message, messages);
            const processName: string = (parentMessage && parentMessage.metaData.receivedBy) || "start";

            let event: string;
            if (message.metaData.intent === Intents.reply) {
                message.metaData.receivedBy = this.getParentMessage(parentMessage, messages).metaData.receivedBy;
                event = `${processName} -.-> |${message.type}| ${message.metaData.receivedBy || "unhandled"}`;
            } else {
                event = `${processName} --> |${message.type}| ${message.metaData.receivedBy || "unhandled"}`;
            }

            // at this point can add styles too
            output += "\n" + event;
        });

        return output;
    }

    public sequenceDiagram(messages: IMessage<any>[]): string {
        let output: string = "sequenceDiagram\n\nparticipant start";

        // define the processes
        const processes: Set<string> = this.getProcessesFromMessages(messages);

        processes.forEach(process => {
            // at this point can add styles too
            output += "\nparticipant " + process;
        });

        // associate messages with processes
        messages.forEach(message => {
            // lookup the parent process based on the correlationId
            const parentMessage: IMessage<any> = this.getParentMessage(message, messages);
            const processName: string = (parentMessage && parentMessage.metaData.receivedBy) || "start";

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

    private getProcessesFromMessages(messages: IMessage<any>[]): Set<string> {
        const processes: Set<string> = new Set<string>();
        messages.forEach(message => {
            if (message.metaData.receivedBy) {
                processes.add(message.metaData.receivedBy);
            }
        });
        return processes;
    }

    private getParentMessage(message: IMessage<any>, allMessages: IMessage<any>[]): IMessage<any> {
        const correlationId = (message.metaData as IMessageTracing).correlationId;
        const parentProcess: IMessage<any>[] = allMessages.filter(
            m => (m.metaData as IMessageTracing).messageId === correlationId);
        return parentProcess[0];
    }
}