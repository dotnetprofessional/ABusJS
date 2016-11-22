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

    
    /**
     * When persistent messages are used, the allowed time to call may have expired when
     * returning at a later date. This method will notify subscribers of any messages that
     * cannot be delivered due to expiry.
     * 
     * @param {(message: IMessage<any>, context: IMessageHandlerContext, options: DeferMessageOptions)=>void} callback
     * 
     * @memberOf TimeoutManager
     */
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
    /**
     * Used to keep track of the timer, the type is any due to
     * different environments such as NodeJs and the DOM having 
     * different types.
     * 
     * @type {*}
     * @memberOf DeferedMessage
     */
    timeoutKey: any;
    options: DeferMessageOptions;
}