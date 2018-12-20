import { IBus, Intents } from "abus2";

export default function reduxAbusThunkMiddleware(bus: IBus, extraArgument?: any) {
    let counter = 0;
    return ({ dispatch, getState }: any) => (next: any) => (action: any) => {
        if (typeof action === "function" || typeof action.action === "function") {
            // register the function action as a handler
            const thunkActionType = action.type || "thunk_action:" + ++counter;
            const subscriptionId = bus.subscribe(thunkActionType, async (message, context) => {
                // unsubscribe to the handler
                bus.unsubscribe(subscriptionId);

                const busDispatch = (message: any) => {
                    // console.log("thunkAbus: Publishing sub task: " + message.type);
                    // adding a correlation Id here would potentially allow full tracing
                    // wait for UI to validate
                    context.publishAsync(message);
                };
                // console.log("thunkAbus: Executing Thunk: " + thunkActionType);
                const result = action.type ? action.action(busDispatch, getState, extraArgument) : action(busDispatch, getState, extraArgument);
                if (typeof result === "string") {

                } else if (result && result.then) {
                    await result;
                }
            });
            // post the message
            // console.log("thunkAbus: dispatching Thunk: " + thunkActionType);
            // Specifying a Send intent prevents the redux-abus middleware handling message
            return next({ type: thunkActionType, metaData: { intent: Intents.send } });
        }

        return next(action);
    };
}
