import { IMessageHandlerContext } from "../IMessageHandlerContext";
import { IMessage } from "..";
import { IMessageHandler } from "../IMessageHandler";
import { newGuid } from "../Guid";

export interface IPersistSagaData {
    save(key: string, data: Object): void;
    get(key: string): Object;
    remove(key: string): void;
}
interface ISagaData {
    eTag?: string,
    sagaKey?: string,
    userData: any;
}

export class InMemoryKeyValueStore implements IPersistSagaData {
    static storage = {};

    /**
     * Clears all saga data stored. This is primarily useful when writing
     * unit tests 
     *
     * @static
     * @memberof InMemoryKeyValueStore
     */
    public static forceClear() {
        InMemoryKeyValueStore.storage = {};
    }

    public save(key: string, data: Object): void {
        // Check the etag to ensure it hasn't changed before saving
        const eTag = data["eTag"];
        const persistedETag = InMemoryKeyValueStore.storage[key] ? InMemoryKeyValueStore.storage[key].eTag : eTag;

        if (eTag && persistedETag !== eTag) {
            throw new Error("Concurrency error saving data.");
        }

        data["eTag"] = newGuid();
        InMemoryKeyValueStore.storage[key] = data;
    }

    public get(key: string): Object {
        return Object.assign({}, InMemoryKeyValueStore.storage[key]);
    }

    public remove(key: string): void {
        delete InMemoryKeyValueStore.storage[key];
    }
}

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
        return (message: any, context: IMessageHandlerContext) => {
            // create a new saga instance
            const sagaKey = this.configureSagaKey(context.activeMessage);
            if (sagaInstance.startSagaWithType === context.activeMessage.type) {
                if (!sagaKey) {
                    throw new Error("Saga key not defined for message: " + context.activeMessage.type);
                }

                if (this.getSagaData(sagaKey).sagaKey) {
                    throw new Error(`Saga with key ${sagaKey} already exists. Can't start saga twice.`);
                }
                this.sagaData.sagaKey = sagaKey;
                // save the default version of the data which only has an eTag
                this.saveSagaData();
            }

            // dehydrate existing saga instance
            const data = this.getSagaData(sagaKey);
            if (!data.eTag) {
                // a message arrived for a saga that doesn't exist
                sagaInstance.sagaNotFound(message, context);
                return;
            }
            const newSagaInstance = new (Object.getPrototypeOf(sagaInstance).constructor) as Saga<any>;
            newSagaInstance.sagaData = data;
            const handler = originalHandler.bind(newSagaInstance);
            try {
                handler(message, context);
                // now persist the data again
                if (this.sagaData.sagaKey !== "complete") {
                    newSagaInstance.saveSagaData();
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
        throw Error(`Unable to find Saga instance for key: ${key}. This may be due to the Saga not being started or being already complete.`);
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
    public complete() {
        this.removeSagaData();
        // update the local sagaData to signify its been deleted
        this.sagaData.sagaKey = "complete";
    }

    private getSagaData(key: string): ISagaData {
        return this.storage.get(key) as ISagaData;
    }

    private saveSagaData() {
        this.storage.save(this.sagaData.sagaKey, this.sagaData);
    }

    private removeSagaData() {
        this.storage.remove(this.sagaData.sagaKey);
    }
}

// notes
/*
    auto-correlation for request-response
    change request/response to cancellation token
*/