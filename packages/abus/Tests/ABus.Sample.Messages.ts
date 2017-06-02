import {
    IMessage,
} from '../App/IMessage';

export class TestMessage implements IMessage<CustomerData>{
    constructor(public name: string) {
        this.type = TestMessage.TYPE;
        this.message = { name: name };
    }

    type: string;
    message: CustomerData;

    static TYPE: string = "test.message";
}

export class Concurrency {
    constructor(c: number) {
        this.counter = c;
    }
    public counter: number;
}

export class TestMessage2 extends TestMessage {
    constructor(name: string) {
        super(name);
        this.type = TestMessage2.TYPE;
    }
    static TYPE: string = "test.message2";
}

export class CustomerData {
    static TYPE = "CustomerData";

    constructor(name?: string) {
        if (name) {
            this.name = name;
        }
    }
    name: string;
}

export class CustomerData2 {
    static TYPE = "CustomerData2";

    constructor(name?: string) {
        if (name) {
            this.name = name;
        }
    }
    name: string;
}

export class Exception {
    constructor(public exceptionMessage: string) {
    }
}

export class MyException extends Exception {

}
