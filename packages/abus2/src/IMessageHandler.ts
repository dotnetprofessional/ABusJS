import { IMessageHandlerContext } from "./IMessageHandlerContext";

export interface IMessageHandler<T> {
    (message: T, context: IMessageHandlerContext): void | Promise<void>;
}