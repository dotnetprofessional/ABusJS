import { IPersistDocuments } from './IPersistDocuments';
import { IDocument } from './IDocument';
import { IMessageHandler, IMessageHandlerContext, IMessage, getTypeNamespace, newGuid } from 'abus';

export interface IStorage<T> {
    getValueAsync(): Promise<T>,
    getDocumentAsync(): Promise<IDocument<T>>,
    storeAsync(): Promise<void>
}

export abstract class Process {
    protected processKey = this.constructor.name;

    constructor() {
        const anyThis = this as any;
        if (!anyThis.__messageHandlers) {
            throw new Error("Processes/Sagas must have at least one message handler defined with @handler");
        }

        // wrap the handlers with a process message handler so all messages can be intercepted
        for (let i = 0; i < anyThis.__messageHandlers.length; i++) {
            const originalHandlerName = anyThis.__messageHandlers[i].handler;
            anyThis[originalHandlerName] = this.handlerInterceptor(anyThis[originalHandlerName]);
        }
    }

    protected handlerInterceptor(originalHandler: IMessageHandler<any>) {
        return async (message: any, context: IMessageHandlerContext) => {
            const newInstance = new (Object.getPrototypeOf(this).constructor);
            const handler = originalHandler.bind(newInstance);

            await newInstance.beforeHandlerAsync(context);
            await handler(message, context);
            await newInstance.afterHandlerAsync(context);
        };
    }

    protected beforeHandlerAsync(context: IMessageHandlerContext) {

    }

    protected afterHandlerAsync(context: IMessageHandlerContext) {
    }


    protected useStorage<T>(provider: IPersistDocuments<T>, defaultValue?: T, key?: string | { (): string }): IStorage<T> {
        const _this = this;
        function getKey(): string {
            if (typeof key === "string") {
                return key
            } else if (typeof key === "function") {
                return key();
            } else {
                return getTypeNamespace(_this);
            }
        }

        async function setDocumentAsync() {
            document = await provider.getAsync(getKey());
            if (!document.data) {
                document.data = defaultValue;
            }
        }

        let document: IDocument<T>;

        return {
            getValueAsync: async () => {
                if (!document) {
                    await setDocumentAsync();
                }
                return document.data;
            },
            getDocumentAsync: async () => {
                if (!document) {
                    await setDocumentAsync();
                }
                return document;
            },
            storeAsync: async () => {
                const existingDocument = await provider.getAsync(getKey());
                if (existingDocument && existingDocument.data && existingDocument.eTag !== document.eTag) {
                    throw Error("ETag mismatch");
                }

                // save the document
                await provider.saveAsync(document);
            }
        };
    }
}