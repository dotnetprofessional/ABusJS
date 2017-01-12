import {MetaData} from './MetaData'
import {IMessage} from './IMessage'
import {SendOptions} from './SendOptions'
import {Bus} from './ABus'

/**
 * Provides additional information about the current state
 * of the message being processed. The metaData property
 * can be used to pass additional data through the pipeline
 * 
 * @export
 * @interface IMessageHandlerContext
 */
export interface IMessageHandlerContext {
    readonly messageType: string;
    readonly messageId: string;
    readonly replyTo: string;
    readonly sagaKey: string;
    readonly shouldTerminatePipeline: boolean;
    metaData: MetaData;

    bus: Bus

    publish<T>(message: IMessage<T>): void;
    sendAsync<T>(message: IMessage<T>, options?: SendOptions): void
}