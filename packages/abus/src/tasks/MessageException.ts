import { IBusError } from "./IBusError";

export class MessageException {
    constructor(public message: string, public error: Error) {
        // errors can't be serialized, however attempting to serialize them loses the ability to use them effectively
        // as such for now leaving them as raw errors. Need to consider mapping serialized errors to native ABus errors
        // to maintain consistency when using transports that require the error to be serialized.
        //{ name: error.name, message: error.message, stack: error.stack }
        // this.error = error;
    }


    // public error: IBusError;
    public static type = "Bus.Error";
}

