import { IPersistSagaData } from './IPersistSagaData';
import { InMemoryKeyValueStore } from './InMemoryKeyValueStore';
import { ISagaData } from './ISagaData';
import { IMessageHandler, IMessageHandlerContext, IMessage } from 'abus2';

export abstract class Saga<T> {
    private startSagaWithType: string;
    private storage: IPersistSagaData = new InMemoryKeyValueStore();
    private sagaData: ISagaData;

    public get data(): T {
        return this.sagaData.userData;
    }

    constructor() {
        const anyThis = this as any;
        if (!anyThis.__messageHandlers) {
            throw new Error("Sagas must have at least one message handler defined with @handler");
        }
        // wrap the handlers with a saga message handler so all messages can be intercepted
        for (let i = 0; i < anyThis.__messageHandlers.length; i++) {
            const originalHandlerName = anyThis.__messageHandlers[i].handler;
            anyThis[originalHandlerName] = this.sagaMessageHandler(anyThis[originalHandlerName]);
        }

        this.sagaData = { userData: {} };
    }

    private sagaMessageHandler(originalHandler: IMessageHandler<any>) {
        const sagaInstance = this;
        return async (message: any, context: IMessageHandlerContext) => {
            // create a new saga instance
            let sagaKey = this.configureSagaKey(context.activeMessage);
            // To ensure uniqueness for keys add the name of the Saga to the key
            sagaKey = this.constructor.name + ":" + sagaKey;
            if (sagaInstance.startSagaWithType === context.activeMessage.type) {
                if (!sagaKey) {
                    throw new Error("Saga key not defined for message: " + context.activeMessage.type);
                }

                if ((await this.getSagaDataAsync(sagaKey)).sagaKey) {
                    throw new Error(`Saga with key ${sagaKey} already exists. Can't start saga twice.`);
                }
                this.sagaData.sagaKey = sagaKey;
                // save the default version of the data which only has an eTag
                await this.saveSagaDataAsync();
            }

            // dehydrate existing saga instance
            const data = await this.getSagaDataAsync(sagaKey);
            if (!data.eTag) {
                // a message arrived for a saga that doesn't exist
                sagaInstance.sagaNotFound(message, context);
                return;
            }
            const newSagaInstance = new (Object.getPrototypeOf(sagaInstance).constructor) as Saga<any>;
            newSagaInstance.sagaData = data;
            const handler = originalHandler.bind(newSagaInstance);
            try {
                await handler(message, context);
                // now persist the data again
                if (!this.sagaData.sagaKey) {
                    await newSagaInstance.saveSagaDataAsync();
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
        this.sagaData = { userData: {} };
    }

    public isCompleted(): boolean {
        return false;
    }

    private async getSagaDataAsync(key: string): Promise<ISagaData> {
        return await this.storage.getAsync(key) as ISagaData;
    }

    private async saveSagaDataAsync(): Promise<void> {
        return this.storage.saveAsync(this.sagaData.sagaKey, this.sagaData);
    }

    private removeSagaDataAsync(): Promise<void> {
        return this.storage.removeAsync(this.sagaData.sagaKey);
    }
}

// notes
/*
    auto-correlation for request-response
    change request/response to cancellation token
*/