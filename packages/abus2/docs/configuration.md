# Configuration
Before a message can be sent or received, the bus requires configuration. At its simplest, only the following lines are required:

```ts
import {Bus} from "abus";

const bus = new Bus();
// don't forget this!
bus.start();
```

This code creates an instance of the bus and starts the default transports ready to listen for incoming messages. The `start` method is important as it configures the registered transports.

However, there are many other options that can be configured at this stage. Namely around routing messages to particular transports. By default the `ExpressMemoryTransport` is configured for all messages if no other default transport has been defined. This transport provides a simple and efficient in memory transport.

Refer to the [transports section](transports.md) for more details on how to configure additional transports.

### IoC
If your application uses an [IoC container](https://www.martinfowler.com/articles/injection.html), ABus can be configured to make use of it. ABus ships with support for the [inversify](http://inversify.io/) library. However, any library can be supported by implementing a simple interface. To configure inversify requires the following code:

```ts
import { Container } from 'inversify';
import { InversifyIoC } from 'abus-inversify';

let container = new Container();

const bus = new Bus();
bus.usingIoC(new InversifyIoC(container));
bus.start();
```
Refer to the [Custom IoC section](custom-ioc.md) for more details on how to support other IoCs.
