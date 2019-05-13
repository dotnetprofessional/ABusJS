import { combineReducers } from 'redux';
import { monitorReducer } from "./monitor";
import { windowReducer } from "./window"
export * from "./monitor";

export const rootReducer = combineReducers({
    messages: monitorReducer,
    window: windowReducer,
});