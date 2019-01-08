export class MessageException {
    constructor(public description: string, public error: Error) {
    }

    public static type = "Bus.Error";
}