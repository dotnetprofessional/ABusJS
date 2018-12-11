
export class MessageException {
    constructor(public error: string, public message) {
    }

    public static type = "Bus.Error";
}