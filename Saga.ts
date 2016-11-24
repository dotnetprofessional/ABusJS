import * as abus from './Abus';
import TimeSpan from './TimeSpan'
import HashTable from './HashTable'

export class Saga<T> {
    isComplete: boolean;

    private storage : IPersistSagaData<T>;

    constructor();
    constructor(storage?: IPersistSagaData<T>) {
        if(!storage) {
            storage = new InMemorySagaStorage<T>();
        }

        this.storage = storage;
    }
    
    markAsComplete(): void {
        this.storage.Complete();
    }

    /**
     * @param message : IMessage<T> message to recieve after timeout has expired
     * @param delay : Date the date and time the message should be delivered or a TimeSpan
     */
    requestTimeout(message: abus.IMessage<T>, delay: TimeSpan | Date) {

    }
    
    
}

export interface IPersistSagaData<T> {
    Save(key: string): Promise<void>;
    Get<T>(key: string): Promise<T>;
    Complete(key:string): Promise<void>;
}

// Rethink if both a Save and Update are required.
export class InMemorySagaStorage<T> implements IPersistSagaData<T> {
    private _data: HashTable<T> = new HashTable<T>();

    Save(key:string): Promise<void> {
        // No Op
        return new Promise<void>(resolve => {
            resolve();
        });
    }

    Get<T>(key: string): Promise<T> {
        return new Promise<T>(resolve => {
            return this._data.item(key);
        });
    }

    Complete(key: string): Promise<void> {
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
*/