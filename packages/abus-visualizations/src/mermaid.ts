import { IMessage, Intents, IMessageTracing } from "abus";

/**
 * Provides a set of diagrams based on the mermaid diagramming language
 *
 * @export
 * @class Mermaid
 */
export class Mermaid {
    public processFlowDiagram(messages: IMessage<any>[]): string {
        let output: string = "graph TD\n";

        // determine what the starting process should be
        const firstMessage = messages[0];
        const startProcess = (firstMessage.metaData && firstMessage.metaData.sentBy) || "Start";

        // define the processes
        const processes: Set<string> = this.getProcessesFromMessages(startProcess, messages);

        processes.forEach(process => {
            // at this point can add styles too
            output += "\n" + process;
        });

        // this is a small hack to make it clear which message started the whole thing
        messages[0].metaData.sentBy = "Start";

        // associate messages with processes
        messages.forEach(message => {
            // lookup the parent process based on the correlationId
            const sentByProcess: string = (message.metaData && message.metaData.sentBy) || startProcess;

            let event: string;
            if (message.metaData.intent === Intents.reply) {
                const parentMessage: IMessage<any> = this.getParentMessage(message, messages);
                const parentMessageParent = this.getParentMessage(parentMessage, messages);
                message.metaData.receivedBy = parentMessageParent ? parentMessageParent.metaData.receivedBy : startProcess;
                event = `${sentByProcess} -.-> |${message.type}| ${message.metaData.receivedBy || "unhandled"}`;
            } else {
                event = `${sentByProcess} --> |${message.type}| ${message.metaData.receivedBy || "unhandled"}`;
            }

            // at this point can add styles too
            output += "\n" + event;
        });

        return output;
    }

    public sequenceDiagram(messages: IMessage<any>[]): string {
        let output: string = "sequenceDiagram\n";

        // determine what the starting process should be
        const firstMessage = messages[0];
        const startProcess = (firstMessage.metaData && firstMessage.metaData.sentBy) || "Start";

        // define the processes
        const processes: Set<string> = this.getProcessesFromMessages(startProcess, messages);

        processes.forEach(process => {
            // at this point can add styles too
            output += "\nparticipant " + process;
        });

        // associate messages with processes
        messages.forEach(message => {
            // lookup the parent process based on the correlationId
            const sentByProcess: string = (message.metaData && message.metaData.sentBy) || startProcess;

            let event: string;
            // at this point can add styles too
            if (message.metaData.intent === Intents.reply) {
                const parentMessage: IMessage<any> = this.getParentMessage(message, messages);
                const parentMessageParent = this.getParentMessage(parentMessage, messages);
                message.metaData.receivedBy = parentMessageParent ? parentMessageParent.metaData.receivedBy : startProcess;
                event = `${sentByProcess}-->>${message.metaData.receivedBy || "unhandled"}:${message.type}`;
            } else {
                event = `${sentByProcess}->>${message.metaData.receivedBy || "unhandled"}:${message.type}`;
            }

            output += "\n" + event;
        });

        return output;
    }

    private getProcessesFromMessages(startProcess: string, messages: IMessage<any>[]): Set<string> {
        const processes: Set<string> = new Set<string>();
        // add the ones we know about and force their order
        processes.add(startProcess);

        messages.forEach(message => {
            if (message.metaData.receivedBy) {
                processes.add(message.metaData.receivedBy);
            }
            if (message.metaData.sentBy) {
                processes.add(message.metaData.sentBy);
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