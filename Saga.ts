import * as abus from './Abus';
import TimeSpan from './TimeSpan'
import HashTable from './HashTable'
import * as testData from './Tests/Abus.sample.messages'
import { MessageException } from './MessageTasks'

class SagaNotFoundException<T> extends MessageException<T> {
    constructor(public error: string, public message: abus.IMessage<T>) {
        super(error, message);
    }

    public description: string = "Unable to locate Saga data for message";
}

export abstract class Saga<T> {
    public storage: IPersistSagaData<T>;
    public bus: abus.Bus;
    public data: T;
    private sagaKey: string;
    public sagaKeyMapping: HashTable<(message: any) => string> = new HashTable<(message: any) => string>();

    constructor();
    constructor(storage?: IPersistSagaData<T>) {
        if (!storage) {
            storage = new InMemorySagaStorage<T>();
        }

        this.storage = storage;
    }
    getDefault(): T {
        return {} as T;
    };

    private getSagaKey(message: abus.IMessage<any>): string {
        let mapper = this.sagaKeyMapping.item(message.type);
        if (!mapper) {
            throw new TypeError("Unable to locate Saga mapper for type: " + message.type);
        }

        return mapper(message.message);
    }

    subscribe<T>(subscription: abus.IMessageSubscription<T>, options: abus.MessageHandlerOptions = new abus.MessageHandlerOptions()): abus.RegisteredSubscription {
        let handlerName = this.getFunctionName(subscription.handler);
        let sagaHandler = async (message: any, context: abus.MessageHandlerContext) => {
            // Setup the Saga instance for this message
            var sagaKey = context.sagaKey;
            if(!sagaKey){
                throw new TypeError("Unable to locate Saga key for type: " + message.type);
            }

            this.sagaKey = sagaKey;
            this.data = await this.storage.get(sagaKey);
            if (!this.data) {
                // Unable to locate Saga data, therefore the Saga was either not started or has already finsished
                // publish a message incase this wasn't an expected event.
                context.publish({ type: SagaNotFoundException.typeName, message: new SagaNotFoundException("Saga key: " + sagaKey, message) });
            } else {
                // Now execute the real handler
                this[handlerName](message.message, context);
                this.storage.save(sagaKey, this.data);
            }
        };

        subscription.handler = sagaHandler;
        return this.bus.subscribe(subscription, options);
    }

    subscribeAsSagaStart<T>(subscription: abus.IMessageSubscription<T>, options: abus.MessageHandlerOptions = new abus.MessageHandlerOptions()): abus.RegisteredSubscription {
        let handlerName = this.getFunctionName(subscription.handler);
        let sagaHandler = async (message: any, context: abus.MessageHandlerContext) => {
            var sagaKey = this.getSagaKeyFromMessage(message, context);
            this.sagaKey = sagaKey;
            // Setup the Saga instance for this message
            this.data = this.storage.get(sagaKey);
            if (!this.data) {
                // No Saga data was found so create default state and continue
                this.data = this.getDefault();
                this.storage.udpate(sagaKey, this.data);
            }

            // Now execute the real handler
            this[handlerName](message.message, context);
            this.storage.save(sagaKey, this.data);
        };
        subscription.handler = sagaHandler;
        return this.bus.subscribe(subscription, options);
    }

    private getFunctionName(fn: any): string {
        for (var p in this)
            if (this[p] === fn)
                return p;
        return "";
    }
    markAsComplete(): void {
        this.storage.complete(this.sagaKey);
    }

    /**
     * @param message : IMessage<T> message to recieve after timeout has expired
     * @param delay : Date the date and time the message should be delivered or a TimeSpan
     */
    requestTimeout(message: abus.IMessage<T>, delay: TimeSpan | Date) {

    }

    private getSagaKeyFromMessage(message: abus.IMessage<any>, context: abus.MessageHandlerContext) {
        var sagaKey = context.sagaKey;
        if (!sagaKey) {
            sagaKey = this.getSagaKey(message);
            context.sagaKey = sagaKey;
        }

        return sagaKey;
    }

}

export interface IPersistSagaData<T> {
    save(key: string, data: T): Promise<void>;
    udpate(key: string, data: T): Promise<void>;
    get(key: string): T;
    complete(key: string): Promise<void>;
}

// Rethink if both a Save and Update are required.
export class InMemorySagaStorage<T> implements IPersistSagaData<T> {
    private _data: HashTable<T> = new HashTable<T>();

    save(key: string, data: T): Promise<void> {
        return new Promise<void>(resolve => {
            this._data.update(key, data);
        });
    }
    /*
        get(key: string): Promise<T> {
            return new Promise<T>(resolve => {
                let data = this._data.item(key);
                return data;
            });
        }
*/

    udpate(key: string, data: T): Promise<void> {
        // same operation for memory storage
        return this.save(key, data);
    }

    get(key: string): T {
        let data = this._data.item(key);
        return data;
    }
    complete(key: string): Promise<void> {
        return new Promise<void>(resolve => {
            this._data.remove(key);
        });
    }
}

/*
    Notes:
        Saga storage should have a ETag to handle concurrency issues. Simple example, HandlerA is waiting for a service call
        then HandlerB receives a message and updates state. HandlerA should fail as the state has changed since the handler started.
        This would typically be handled automatically via a retry, though this would require isolated state to perform a rollback.
        This can be handled by the Get<T> method and can have multiple implementations that both cater for this and not.

        Handling global state should be at the storage level which can attach to a global store. The Saga treats state as a transient
        concept that is retrieved for each invocation of the handler. Robustness requires persistent messaging. This may be achieve with 
        a simple Deferral of message.
*/