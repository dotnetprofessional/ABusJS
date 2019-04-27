import { IDependencyContainer } from './IDependencyContainer';

export class DefaultIoC implements IDependencyContainer {
    public resolve<T>(constructorFunction: any): T {
        return new constructorFunction;
    }
}