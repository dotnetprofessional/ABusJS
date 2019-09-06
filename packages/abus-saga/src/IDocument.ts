export interface IDocument<T> {
    eTag?: string;
    key?: string;
    data: T;
    timestamp?: number;
}