import { IBusError } from "./IBusError";

export class MessageException {
    constructor(public description: string, error: Error) {
        this.error = { name: error.name, message: error.message, stack: error.stack }
    }


    public error: IBusError;
    public static type = "Bus.Error";
}

