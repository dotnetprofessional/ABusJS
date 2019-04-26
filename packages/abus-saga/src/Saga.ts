import { IPersistDocuments } from './IPersistDocuments';
import { InMemoryKeyValueStore } from './InMemoryKeyValueStore';
import { IDocument } from './IDocument';
import { IMessageHandler, IMessageHandlerContext, IMessage } from 'abus2';
import { Process } from './Process';

export abstract class Saga<T> extends Process {
    private startSagaWithType: string;
    private sagaDocument: IDocument<T>;

    public get data(): T {
        return this.sagaDocument.data;
    }

    constructor(protected storage: IPersistDocuments<T> = new InMemoryKeyValueStore<T>()) {
        super();
    }

    protected handlerInterceptor(originalHandler: IMessageHandler<any>) {
        return async (message: any, context: IMessageHandlerContext) => {
            // create a new saga instance
            const instance = new (Object.getPrototypeOf(this).constructor) as Saga<any>;
            let sagaKey = this.configureSagaKey(context.activeMessage);
            // To ensure uniqueness for keys add the name of the Saga to the key
            sagaKey = this.constructor.name + ":" + sagaKey;

            // dehydrate existing saga instance
            const dataProvider = this.useStorage(this.storage, undefined, sagaKey);
            this.sagaDocument = await dataProvider.getDocumentAsync();
            if (instance.startSagaWithType === context.activeMessage.type) {
                if (!sagaKey) {
                    throw new Error("Saga key not defined for message: " + context.activeMessage.type);
                }

                if (this.sagaDocument.data) {
                    throw new Error(`Saga with key ${sagaKey} already exists. Can't start saga twice.`);
                } else {
                    // create an empty object as default
                    this.sagaDocument.data = {} as T;
                }
                this.sagaDocument.key = sagaKey;
                // save the default version of the data which only has an eTag
                // await this.saveSagaDataAsync();
            } else if (!this.sagaDocument.eTag) {
                // a message arrived for a saga that doesn't exist
                instance.sagaNotFound(message, context);
                return;
            }

            instance.sagaDocument = this.sagaDocument;
            const handler = originalHandler.bind(instance);
            try {
                await instance.beforeHandlerAsync(context);
                await handler(message, context);
                await instance.afterHandlerAsync(context);
                if (this.sagaDocument.key) {
                    // now persist the data again
                    await dataProvider.storeAsync();
                }
            } catch (e) {
                // handle exception here
                throw e;
            }
        };
    }

    /**
     * called when ever an incoming message can't be matched to an existing saga
     * this is a good place to implement error handling logic for a saga
     *
     * @param {Object} message
     * @param {IMessageHandlerContext} context
     * @memberof Saga
     */
    public sagaNotFound(message: IMessage<any>, context: IMessageHandlerContext) {
        const key = this.configureSagaKey(context.activeMessage);
        throw Error(`Received message type: ${context.activeMessage.type}, however unable to find Saga instance for key: ${key}. This may be due to the Saga not being started or being already complete.`);
    }

    /**
     * returns the key used to identify the current saga
     * each message type must be able to identify the saga key
     * using its properties such as orderId.
     *
     * @abstract
     * @param {IMessage<any>} message
     * @returns {string}
     * @memberof Saga
     */
    public abstract configureSagaKey(message: IMessage<any>): string;

    /**
     * Sends the message back to the original saga that started this saga
     * is this required??? should be able to do this without this? ie just bus.send?
     * @param {IMessage<any>} message
     * @memberof Saga
     */
    public replyToOriginator(message: IMessage<any>) {

    }

    /**
     * registers the message type that is used to start the saga
     *
     * @param {string} type
     * @memberof Saga
     */
    public sagaStartedWith(type: string) {
        this.startSagaWithType = type;
    }

    /**
     * completes the saga and removes associated state 
     *
     * @memberof Saga
     */
    public async completeAsync() {
        await this.removeSagaDataAsync();
        // update the local sagaData to signify its been deleted
        this.sagaDocument = { data: {} as T };
    }

    public isCompleted(): boolean {
        return false;
    }

    // private async getSagaDataAsync(key: string): Promise<IDocument<T>> {
    //     return await this.storage.getAsync(key);
    // }

    // private async saveSagaDataAsync(): Promise<void> {
    //     return this.storage.saveAsync(this.sagaDocument);
    // }

    private removeSagaDataAsync(): Promise<void> {
        return this.storage.removeAsync(this.sagaDocument.key);
    }
}

// notes
/*
    auto-correlation for request-response
*/