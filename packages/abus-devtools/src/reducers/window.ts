import { ActionType, getType } from "typesafe-actions";
import * as messages from '../messages';
import { IWindowSizeChanged } from '../messages/IWindowSizeChanged';

export interface IWindowSize {
    windowHeight: number;
}

const defaultState: IWindowSize = {
    windowHeight: typeof window === 'object' ? window.innerHeight : 1080,
}

const handleWindowResize = (windowSize: IWindowSizeChanged): IWindowSize => {
    return { windowHeight: windowSize.windowHeight };
}

export const windowReducer = (
    state: IWindowSize = defaultState,
    action: ActionType<typeof messages>
): IWindowSize => {
    switch (action.type) {
        case getType(messages.windowSizeChanged):
            return handleWindowResize(action.payload);
        default:
            return state;
    }
};
