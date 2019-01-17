import { IPersistSagaData } from './IPersistSagaData';
import { newGuid } from "abus2";

export class InMemoryKeyValueStore implements IPersistSagaData {
    static storage = {};
    /**
     * Clears all saga data stored. This is primarily useful when writing
     * unit tests
     *
     * @static
     * @memberof InMemoryKeyValueStore
     */
    public static forceClear(): void {
        InMemoryKeyValueStore.storage = {};
    }
    public async saveAsync(key: string, data: Object): Promise<void> {
        // check the etag to ensure it hasn't changed before saving
        const eTag: string = data["eTag"];
        const persistedETag = InMemoryKeyValueStore.storage[key] ? InMemoryKeyValueStore.storage[key].eTag : eTag;
        if (eTag && persistedETag !== eTag) {
            throw new Error("Concurrency error saving data.");
        }
        data["eTag"] = newGuid();
        InMemoryKeyValueStore.storage[key] = data;
    }
    public async getAsync(key: string): Promise<Object> {
        return Object.assign({}, InMemoryKeyValueStore.storage[key]);
    }
    public async removeAsync(key: string): Promise<void> {
        delete InMemoryKeyValueStore.storage[key];
    }
}
