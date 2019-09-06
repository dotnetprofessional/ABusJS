import { IMessage } from "./IMessage";

export class ErrorEx extends Error {
    protected __proto__: Error;
    constructor(message: string, trueProto: any) {
        super(message);
        const name: string = this.constructor.name;
        // alternatively use Object.setPrototypeOf if you have an ES6 environment.
        this.__proto__ = trueProto;
        this.name = name;
    }
}

export class ReplyHandlerCancelledException extends ErrorEx {
    constructor(message: string, public reply: any) {
        super(message, new.target.prototype);
    }
}

export class HandlerCancelledException extends ErrorEx {
    constructor(message: string, public reply: any) {
        super(message, new.target.prototype);
    }
}

export class TimeoutException extends ErrorEx {
    constructor(message: string) {
        super(message, new.target.prototype);
    }
}