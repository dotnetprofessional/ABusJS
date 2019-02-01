import { IBus, Intents, IMessageHandlerContext, IMessage, newGuid, IBusMetaData } from "abus2";

export interface IHashTable<T> {
    [key: string]: T;
}

interface IThunkMetaData extends IBusMetaData {
    isSynthetic: boolean;
    thunkId: string;
    actionType: string;
}

export default function reduxAbusThunkMiddleware(bus: IBus, extraArgument?: any) {
    const thunkSubscriptionName = "ABus.Thunk";
    let counter: number = 0;
    const queue: IHashTable<{ action: Function }> = {};

    return ({ dispatch, getState }: any) => (next: any) => {
        // subscribe thunk messages
        const subscriptionId = bus.subscribe(thunkSubscriptionName, async (message: IMessage<any>, context: IMessageHandlerContext) => {
            const metaData = message.metaData as IThunkMetaData;
            const action: any = queue[metaData.thunkId];
            delete queue[metaData.thunkId];
            // this function is used by a thunk if it dispatches actions
            const busDispatch = (context: IMessageHandlerContext) => (message: any) => {
                // console.log("thunkAbus: Publishing sub task: " + message.type);

                // are we dealing with another thunk?
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
            // console.log("thunkAbus: Executing Thunk: " + metaData.actionType);
            const result: any = action.type ? action.action(busDispatch(context), getState, extraArgument)
                : action(busDispatch(context), getState, extraArgument);
            if (result && result.then) {
                await result;
            }

        });

        return (action: any) => {
            if (typeof action === "function" || typeof action.action === "function") {
                // register the function action as a handler
                const thunkActionType: string = action.type || "thunk_action:" + ++counter;
                // post the message
                // console.log("thunkAbus: dispatching Thunk: " + thunkActionType);
                // specifying a Send intent prevents the redux-abus middleware handling message
                const metaData: IThunkMetaData = { intent: Intents.send, isSynthetic: true, thunkId: newGuid(), actionType: thunkActionType };
                // register the action for later execution
                queue[metaData.thunkId] = action;

                if (action.metaData && action.metaData.correlationId) {
                    (metaData as any).correlationId = action.metaData.correlationId;
                }

                // dispatch an action that will then be published by the abus-redux middleware
                return next({ type: thunkSubscriptionName, metaData: metaData });
            }

            return next(action);
        };
    };
}