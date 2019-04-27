import { IPersistDocuments } from './IPersistDocuments';
import { newGuid, TimeSpan } from "abus";
import { IDocument } from './IDocument';

export class InMemoryKeyValueStore<T> implements IPersistDocuments<T> {
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
    public async saveAsync(document: IDocument<T>): Promise<void> {
        // check the etag to ensure it hasn't changed before saving
        const eTag: string = document.eTag;
        const persistedETag = InMemoryKeyValueStore.storage[document.key] ? InMemoryKeyValueStore.storage[document.key].eTag : eTag;
        if (eTag && persistedETag !== eTag) {
            throw new Error("Concurrency error saving data.");
        }
        document.eTag = newGuid();
        document.timestamp = new Date().getMilliseconds();
        InMemoryKeyValueStore.storage[document.key] = document;
    }
    public async getAsync(key: string): Promise<IDocument<T>> {
        // provides a shallow copy of the current data
        let document = InMemoryKeyValueStore.storage[key];
        if (!document) {
            document = { key }
        }
        return document;
    }
    public async removeAsync(key: string): Promise<void> {
        delete InMemoryKeyValueStore.storage[key];
    }
}
