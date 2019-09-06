import { IDependencyContainer } from 'abus';
import { Container } from "inversify";

export class InversifyIoC implements IDependencyContainer {
    constructor(protected container: Container) {

    }
    public resolve<T>(constructorFunction: any): T {
        return this.container.resolve(constructorFunction);
    }
}