import { IBus, IMessageHandlerContext } from "abus";

export default function reduxAbusMiddleware(bus: IBus) {
    return (store: any) => (next: any) => {
        // register for all events to send to the default dispatcher
        bus.subscribe("*", (message: any, context: IMessageHandlerContext) => {
            console.log("reduxAbus: dispatching action: " + context.activeMessage.type);
            next(context.activeMessage);
        }, { identifier: "Redux:Reducer" });

        return (action: any) => {
            console.log("reduxAbus: publishing action: " + action.type);
            bus.publishAsync(action);
        };
    };
}