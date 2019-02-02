import { IDocument } from "./IDocument";
import { TimeSpan } from 'abus2';

/**
 * Provides an interface for persisting a document aka object
 *
 * @export
 * @interface IPersistDocuments
 * @template T
 */
export interface IPersistDocuments<T> {
    saveAsync(document: IDocument<T>): Promise<void>;
    getAsync(key: string): Promise<IDocument<T>>;
    removeAsync(key: string): Promise<void>;
}
