import { IPersistDocuments } from './IPersistDocuments';
import { InMemoryKeyValueStore } from './InMemoryKeyValueStore';
import { IDocument } from './IDocument';
import { IMessageHandler, IMessageHandlerContext, IMessage, getTypeNamespace, newGuid } from 'abus2';

export abstract class Process<T> {
    private storage: IPersistDocuments<T> = new InMemoryKeyValueStore<T>();
    private document: IDocument<T>;
    private processKey: string;

    public get data(): T {
        return this.document.data;
    }

    constructor() {
        const anyThis = this as any;
        if (!anyThis.__messageHandlers) {
            throw new Error("Processes must have at least one message handler defined with @handler");
        }
        // wrap the handlers with a process message handler so all messages can be intercepted
        for (let i = 0; i < anyThis.__messageHandlers.length; i++) {
            const originalHandlerName = anyThis.__messageHandlers[i].handler;
            anyThis[originalHandlerName] = this.processMessageHandler(anyThis[originalHandlerName]);
        }

        this.document = { data: {} as T };
        this.processKey = getTypeNamespace(this);
    }

    private processMessageHandler(originalHandler: IMessageHandler<any>) {
        const instance = this;
        return async (message: any, context: IMessageHandlerContext) => {
            // dehydrate existing saga instance
            const data = await this.getSagaDataAsync(this.processKey);
            if (!data.eTag) {
                // this is the first time the process handler has been invoked, so setup the default data
                this.document = {
                    key: this.processKey,
                    data: {} as T
                };
            }
            // create a new instance to ensure isolation
            const newProcessInstance = new (Object.getPrototypeOf(instance).constructor) as Process<any>;
            newProcessInstance.document = data;
            const handler = originalHandler.bind(newProcessInstance);
            try {
                await handler(message, context);
                // now persist the data again
                if (!this.document.key) {
                    await newProcessInstance.saveDocument();
                }
            } catch (e) {
                // handle exception here
                throw e;
            }
        };
    }

    private async getSagaDataAsync(key: string): Promise<IDocument<T>> {
        return await this.storage.getAsync(key);
    }

    private async saveDocument(): Promise<void> {
        return this.storage.saveAsync(this.document);
    }
}