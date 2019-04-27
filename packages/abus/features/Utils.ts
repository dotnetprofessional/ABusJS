import { IMessageTask, IMessage, IMessageHandlerContext } from '../src';

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export async function waitUntilAsync(condition: Function, timeout: number) {
    const startTime = Date.now();
    while (Date.now() - startTime <= timeout && !condition()) {
        await sleep(5);
    }
}

export class MessageLogger implements IMessageTask {
    public messages: IMessage<any>[] = [];

    public async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any): Promise<void> {
        this.messages.push(message);
        await next();
    }
}