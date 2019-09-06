import { IMessageTransport } from "./IMessageTransport";
import { IMessage } from "../IMessage";
import { TimeSpan } from "../Timespan";

/**
 * This is the no-frills transport which is the closest to using a simple event emitter.
 * 
 * This transport should be used when speed is important and there's no need for more advanced features
 * @export
 * @class ExpressMemoryTransport
 * @implements {IMessageTransport}
 */
export class ExpressMemoryTransport implements IMessageTransport {
    private _onMessageHandler: (message: IMessage<any>) => void = null;

    public name: string = "ExpressMemoryTransport";

    public publishAsync(message: IMessage<any>, timeToDelay?: TimeSpan): Promise<void> {
        return this.sendAsync(message, timeToDelay);
    }

    public async sendAsync(message: IMessage<any>, timeToDelay?: TimeSpan): Promise<void> {
        // As this is all local just send it directly to the handler
        if (timeToDelay) {
            // add the delay meta-data so its clear this message had been delayed
            if (message.metaData) {
                message.metaData.timeToDelay = timeToDelay.totalMilliseconds;
            }
            setTimeout(() => this._onMessageHandler(message), timeToDelay.totalMilliseconds);
        } else {
            this._onMessageHandler(message);
        }
    }

    public onMessage(handler: (message: IMessage<any>) => void) {
        this._onMessageHandler = handler;
    }

    public async completeMessageAsync(messageId: string): Promise<void> {
        // No Op as messages are never recorded
    }

    public async startAsync(): Promise<void> {
        // No op as messages are passes directly to onMessage
    }
}