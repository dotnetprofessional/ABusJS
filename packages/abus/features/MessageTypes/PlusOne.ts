import { handler } from "../../src/decorators/handler";

export let handlerResponse: { value: number } = { value: 0 };

export class MyHandlerByTypeName {

    @handler("plusOne")
    plusOne(message: number) {
        handlerResponse.value += message;
    }

    @handler("plusTwo")
    plusTwo(message: number) {
        handlerResponse.value += message;
    }
}

export class PlusOne {
    constructor(public value: number) { }
}

export class PlusTwo {
    constructor(public value: number) { }
}

export class MyHandlerByTypeDefinition {
    @handler(PlusOne)
    plusOne(message: PlusOne) {
        handlerResponse.value += message.value;
    }

    @handler(PlusTwo)
    plusTwo(message: PlusTwo) {
        handlerResponse.value += message.value;
    }
}

export class HandlersByClassInstance {
    public count: number;

    constructor() {
        this.count = 10;
    }
    @handler(PlusOne)
    plusOne(message: PlusOne) {
        this.count++;
    }

    @handler(PlusTwo)
    plusTwo(message: PlusTwo) {
        this.count += 2;
    }
}
