export interface IPersistSagaData {
    saveAsync(key: string, data: Object): Promise<void>;
    getAsync(key: string): Promise<Object>;
    removeAsync(key: string): Promise<void>;
}
