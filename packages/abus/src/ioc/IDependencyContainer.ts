export interface IDependencyContainer {
    resolve<T>(constructorFunction: any): T;
}