import * as messages from "../messages";
import { ActionType, getType } from 'typesafe-actions';
import { IMessage } from 'abus';

export interface IMessageStore {
    messages: IMessage<any>[];
}

const defaultState = {
    messages: []
}
export const monitorReducer = (
    state: IMessageStore = defaultState,
    action: any//ActionType<typeof messages>
): IMessageStore => {
    switch (action.type) {
        case getType(messages.messageSent): {
            return { ...state };
        };
        case getType(messages.messageProcessed): {
            return {
                ...state,
                messages: [...state.messages, action.payload]
            };
        }
        default:
            return state;
    }
}