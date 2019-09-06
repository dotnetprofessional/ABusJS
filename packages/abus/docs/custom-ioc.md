# Custom IoC
Abus supports the use of an IoC container such as [inversify](http://inversify.io/). However, you may use a different library. Adding support requires creating a class that implements the `IDependencyContainer` interface.

```ts
interface IDependencyContainer {
    resolve<T>(constructorFunction: any): T;
}
```
> For more details on what an IoC is refer to [Martin Fowlers discussion on injection](https://www.martinfowler.com/articles/injection.html).

When implementing this function you simply need to delegate the `constructorFunction` to your IoC container. The folloiwng is the full implementation for the inversify container.

__inversifty IoC__
```ts
import { IDependencyContainer } from 'abus';
import { Container } from "inversify";

export class InversifyIoC implements IDependencyContainer {
    constructor(protected container: Container) {

    }
    public resolve<T>(constructorFunction: any): T {
        return this.container.resolve(constructorFunction);
    }
}
```