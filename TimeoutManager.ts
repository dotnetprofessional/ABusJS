import {IMessage, IMessageHandlerContext, MessagePipeline} from './Abus'
import TimeSpan from './TimeSpan'
import HashTable from './HashTable'

/**
 * Used to manage defered messages including support for persisted messages
 * 
 * @export
 * @class TimeoutManager
 */
export class TimeoutManager {
    private _deferedMessages: HashTable<DeferedMessage>;

    constructor(private pipeline: MessagePipeline) {

    }
    deferMessage(message: IMessage<any>, context: IMessageHandlerContext, options: DeferMessageOptions) {
        // Schedule the message for execution
        let deferFor = TimeSpan.getTimeSpan(options.deliverAt.getTime()).totalMilliseconds;
        let timeoutKey = setTimeout(()=> {
            this._deferedMessages.remove(context.messageId);
            this.pipeline.send(message, context);
        }, deferFor);

        this._deferedMessages.add(context.messageId, {timeoutKey, message, context, options});
        // Should also update a persistance store if the message is persistable.
    }

    registerForTimeouts(callback: (message: IMessage<any>, context: IMessageHandlerContext, options: DeferMessageOptions)=>void) {

    }
}

/**
 * 
 * 
 * @export
 * @class DeferMessageOptions
 */
export class DeferMessageOptions {
    deliverAt: Date;
    timeout: Date;
    isPersistant: boolean;
}

class DeferedMessage {
    message: IMessage<any>;
    context: IMessageHandlerContext;
    timeoutKey: number;
    options: DeferMessageOptions;
}