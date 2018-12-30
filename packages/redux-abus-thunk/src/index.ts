import { IBus, Intents, IMessageHandlerContext } from "abus2";

export default function reduxAbusThunkMiddleware(bus: IBus, extraArgument?: any) {
    let counter = 0;
    return ({ dispatch, getState }: any) => (next: any) => (action: any) => {
        if (typeof action === "function" || typeof action.action === "function") {
            // register the function action as a handler
            const thunkActionType = action.type || "thunk_action:" + ++counter;
            const subscriptionId = bus.subscribe(thunkActionType, async (message, context) => {
                // unsubscribe to the handler
                bus.unsubscribe(subscriptionId);

                const busDispatch = (context: IMessageHandlerContext) => (message: any) => {
                    // console.log("thunkAbus: Publishing sub task: " + message.type);

                    // Are we dealing with another thunk?
                    if (!message.type || typeof action === "function" || typeof action.action === "function") {
                        // debugger;
                        // this is another thunk so treat it like a dispatch, but add a correlationId if applicable
                        if (context.activeMessage.metaData && context.activeMessage.metaData.messageId) {
                            message.metaData = { correlationId: context.activeMessage.metaData.messageId };
                        }
                        dispatch(message);
                    } else {
                        context.publishAsync(message);
                    }
                };
                // debugger;
                console.log("thunkAbus: Executing Thunk: " + thunkActionType);
                const result = action.type ? action.action(busDispatch(context), getState, extraArgument) : action(busDispatch(context), getState, extraArgument);
                if (result && result.then) {
                    await result;
                }
            });
            // post the message
            console.log("thunkAbus: dispatching Thunk: " + thunkActionType);
            // Specifying a Send intent prevents the redux-abus middleware handling message
            const metaData = { intent: Intents.send, isSynthetic: true };
            if (action.metaData && action.metaData.correlationId) {
                (metaData as any).correlationId = action.metaData.correlationId;
            }

            return next({ type: thunkActionType, metaData: metaData });
        }

        return next(action);
    };
}