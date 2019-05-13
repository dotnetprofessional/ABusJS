import { debounce } from 'debounce';
import { windowSizeChanged } from './messages';

const registerWindowSizeChangedEvents = store => {
    function handleWindowResize() {
        store.dispatch(
            windowSizeChanged({ windowHeight: window.innerHeight })
        );
    }

    window.onresize = debounce(handleWindowResize, 500);
};

export const bootstrap = (store) => {
    // registerWindowSizeChangedEvents(store);
}