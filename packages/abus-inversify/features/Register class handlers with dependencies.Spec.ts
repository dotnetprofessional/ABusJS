import "livedoc-mocha";
import "reflect-metadata";
import { Bus, IMessageHandlerContext, handler } from 'abus';
import { injectable, Container, inject } from 'inversify';
import { InversifyIoC } from '../src';
import * as chai from "chai";

const should = chai.should();

const IAmDependantKey = "IAmDependant";

interface IAmDependant {
    magicValue: string;
}

@injectable()
class DependencyOne implements IAmDependant {
    constructor() {
        this.magicValue = "One";
    }
    magicValue: string;
}


@injectable()
class MyHandlers {
    constructor(@inject(IAmDependantKey) protected dependency: IAmDependant) {

    }

    @handler("MY-HANDLER")
    handler(message: any, context: IMessageHandlerContext) {
        context.replyAsync(this.dependency.magicValue);
    }
}

feature(`Register class handlers with dependencies`, () => {
    scenario(`Class with handlers has a dependency`, () => {
        let bus: Bus;
        let container = new Container();
        let magicValue: string;

        given(`a class has a dependency`, () => {
            bus = new Bus();
            bus.start();
            bus.usingIoC(new InversifyIoC(container));
        });

        and(`the dependencies have been registered with the IoC`, () => {
            container.bind<IAmDependant>(IAmDependantKey).to(DependencyOne);
        });

        when(`registering the class with Abus`, () => {
            bus.registerHandlers(MyHandlers);
        });

        and(`sending a message`, async () => {
            magicValue = await bus.sendWithReplyAsync<string>({ type: "MY-HANDLER" });
        });

        then(`the handler is registered to receive messages with the dependencies`, () => {
            magicValue.should.eq("One");
        });
    });
});