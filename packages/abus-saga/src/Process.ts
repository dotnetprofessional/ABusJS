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


    protected useStorage<T>(provider: IPersistDocuments<T>, defaultValue?: T, key?: string | { (): string }, scope?: string): IStorage<T> {
        const _this = this;
        function getKey(): string {
            let keyValue = "";
            if (!scope) {
                scope = getTypeNamespace(_this);
                if (scope.startsWith("Process.Saga")) {
                    scope = scope.substr(8);
                }
            }
            if (typeof key === "string") {
                keyValue = "." + key
            } else if (typeof key === "function") {
                keyValue = "." + key();
            }

            return `${scope}${keyValue}`;
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
                // save the document
                await provider.saveAsync(document);
            }
        };
    }
}