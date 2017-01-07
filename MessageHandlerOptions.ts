export enum ThreadingOptions {
    Single,
    Pool
}

export class MessageHandlerOptions {
    threading?: ThreadingOptions = ThreadingOptions.Single;
}