import {MessageHandlerContext} from './MessageHandlerContext'

export interface IMessageHandler<T> {
    (message: T, context: MessageHandlerContext): void | Promise<void>;
}