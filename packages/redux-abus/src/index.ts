import { IBus, IMessageHandlerContext } from "abus2";

export default function reduxAbusMiddleware(bus: IBus) {
    return (store: any) => (next: any) => {
        // register for all events to sent to the default dispatcher
        bus.subscribe("*", (message: any, context: IMessageHandlerContext) => {
            console.log("reduxAbus: dispatching action: " + context.activeMessage.type);
            next(context.activeMessage);
        });

        return (action: any) => {
            console.log("reduxAbus: publishing action: " + action.type);
            bus.publishAsync(action);
        }
    }
}