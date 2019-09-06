import { IBus, IMessageHandlerContext } from "abus";

export default function reduxAbusMiddleware(bus: IBus) {
    return (store: any) => (next: any) => {
        // register for all events to send to the default dispatcher
        bus.subscribe("*", (message: any, context: IMessageHandlerContext) => {
            next(context.activeMessage);
        }, { identifier: "Redux:Reducer" });

        return (action: any) => {
            bus.publishAsync(action);
        };
    };
}