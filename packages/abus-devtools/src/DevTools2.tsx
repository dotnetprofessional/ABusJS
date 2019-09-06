import { IBus } from 'abus';
import * as React from 'react';
import { Provider } from 'react-redux';
import { applyMiddleware, createStore } from 'redux';
import reduxAbusMiddleware from 'redux-abus';
import { composeWithDevTools } from 'redux-devtools-extension';
import { bootstrap } from './bootstrap';
import { rootReducer } from './reducers';
import Dock from "react-dock";
import injectSheet from "react-jss";
import { Icon, IconName } from "./components/Icon";
import { windowSizeChanged } from './messages';
import { debounce } from '@syncfusion/ej2-base';

const parseKey = require("parse-key");

const styles = {
    header: {
        backgroundColor: "lime",
        fontSize: 14
    },
    closeButton: {
        fontSize: 16,
        color: "grey",
        float: "right",
        margin: {
            top: 15,
            left: 15,
            right: 15,
            bottom: 15
        }
    }

}
@injectSheet(styles)
export class DevTools2 extends React.PureComponent<{ bus: IBus, toggleVisibilityKey: string } & { classes: any }, { isVisible: boolean }> {
    private store: any;

    public constructor(props) {
        super(props);
        this.state = { isVisible: true };
        // configure redux
        const composeEnhancers = composeWithDevTools({
            name: 'ABus Dev Tools',
            actionsBlacklist: [],
        });
        const middleware = [reduxAbusMiddleware(props.bus)];
        this.store = createStore(rootReducer, composeEnhancers(applyMiddleware(...middleware)));

        bootstrap(this.store);
    }

    private closeTools = () => {
        this.setState({ isVisible: false });
    }

    private onSizeChange = (size: number) => {
        this.props.bus.publishAsync(windowSizeChanged({ windowHeight: size }));
    }

    public render() {
        const { classes } = this.props;
        const content = this.state.isVisible && (
            <React.Fragment>
                <div className={classes.header}>
                    <Icon iconName={IconName.close} onClick={this.closeTools} className={classes.closeButton} />
                    <span>ABUS DevTools</span>
                </div>
                <div>this is a test of the dev tools!!</div>
            </React.Fragment>
        );

        return (
            < Provider store={this.store} >
                <Dock position="right"
                    isVisible={this.state.isVisible}
                    duration={200}
                    // size={.3}
                    fluid={true}
                    onSizeChange={debounce(this.onSizeChange, 100)}
                    dimMode="none">
                    {content}
                </Dock>
            </Provider>
        );
    }

    public componentDidMount() {
        window.addEventListener("keydown", this.handleKeyDown);
    }

    public componentWillUnmount() {
        window.removeEventListener("keydown", this.handleKeyDown);
    }

    private matchesKey = (key, event) => {
        if (!key) {
            return false;
        }

        const charCode = event.keyCode || event.which;
        const char = String.fromCharCode(charCode);
        return key.name.toUpperCase() === char.toUpperCase() &&
            key.alt === event.altKey &&
            key.ctrl === event.ctrlKey &&
            key.meta === event.metaKey &&
            key.shift === event.shiftKey;
    }

    private handleKeyDown = (e) => {
        // ignore regular keys when focused on a field
        // and no modifiers are active.
        if ((
            !e.ctrlKey && !e.metaKey && !e.altKey
        ) && (
                e.target.tagName === "INPUT" ||
                e.target.tagName === "SELECT" ||
                e.target.tagName === "TEXTAREA" ||
                e.target.isContentEditable
            )) {
            return;
        }

        const visibilityKey = parseKey(this.props.toggleVisibilityKey);
        if (this.matchesKey(visibilityKey, e)) {
            e.preventDefault();
            this.setState({ isVisible: !this.state.isVisible });
        }
    }

};