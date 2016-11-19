import {
    IMessage,
} from '../ABus';

export class TestMessage implements IMessage<CustomerData>{
    constructor(public name: string) {
        this.type = TestMessage.TYPE;
        this.message = { name: name };
    }

    type: string;
    message: CustomerData;

    static TYPE:string ="test.message";
}

export class TestMessage2 extends TestMessage {
    constructor(name: string) {
        super(name);
        this.type = TestMessage2.TYPE;
    }
    static TYPE:string ="test.message2";
}

export class CustomerData {
    name: string;
}