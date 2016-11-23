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
    Update(key: string, data: T): Promise<void>;
    Get<T>(key: string): Promise<T>;
    Complete(key:string): Promise<void>;
}

// Rethink if both a Save and Update are required.
export class InMemorySagaStorage<T> implements IPersistSagaData<T> {
    private _data: HashTable<T> = new HashTable<T>();

    Save(key: string): Promise<void> {
        // No Op
        return new Promise<void>(resolve => {
            resolve();
        });
    }

    Update(key: string, data: T): Promise<void> {
        return new Promise<void>(resolve => {
            this._data.update(key,  data);
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