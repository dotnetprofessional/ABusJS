import * as React from "react";
import { cloneElement, Children, Component } from "react";
import * as PropTypes from "prop-types";
import Dock from "react-dock";
import { toggleVisibility, changeMonitor, changePosition, changeSize } from "./actions";
import reducer from "./reducers";
const parseKey = require("parse-key");
import { POSITIONS } from "./constants";
import { IBus } from "abus2";
import { ABusMonitor } from "./Abus-Monitor";

export class DevTools extends React.PureComponent<{ bus: IBus }> {
    // toggleVisibilityKey = 'ctrl-h'
    // changePositionKey = 'ctrl-q'
    // changeMonitorKey = 'ctrl-m'
    render() {
        const monitor = <ABusMonitor bus={this.props.bus} />;
        return (
            <DockMonitor toggleVisibilityKey="ctrl-h"
                changePositionKey="ctrl-q"
                changeMonitorKey="ctrl-m"
                fluid={true}
            // monitorState={{
            //     isVisible: true,
            //     position: 'right',
            //     size: 0.3,
            //     fluid: true
            // }}
            >
                {monitor}
            </DockMonitor>
        );
    }
}


export class DockMonitor extends React.PureComponent<{ toggleVisibilityKey: string, changePositionKey: string, changeMonitorKey: string, fluid: boolean }, { isVisible: boolean }> {
    static update = reducer;

    static propTypes = {
        // defaultPosition: PropTypes.oneOf(POSITIONS),
        // defaultIsVisible: PropTypes.bool.isRequired,
        // defaultSize: PropTypes.number.isRequired,
        toggleVisibilityKey: PropTypes.string.isRequired,
        changePositionKey: PropTypes.string.isRequired,
        changeMonitorKey: PropTypes.string,
        fluid: PropTypes.bool,

        // dispatch: PropTypes.func,
        // monitorState: PropTypes.shape({
        //     position: PropTypes.oneOf(POSITIONS).isRequired,
        //     size: PropTypes.number.isRequired,
        //     isVisible: PropTypes.bool.isRequired,
        //     childMonitorState: PropTypes.any
        // })
    };

    // static defaultProps = {
    //     defaultIsVisible: true,
    //     defaultPosition: 'right',
    //     defaultSize: 0.3,
    //     fluid: true
    // };

    constructor(props) {
        super(props);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleSizeChange = this.handleSizeChange.bind(this);
        this.state = { isVisible: false };
        const childrenCount = Children.count(props.children);
        if (childrenCount === 0) {
            console.error(
                "<DockMonitor> requires at least one monitor inside. " +
                "Why don’t you try <LogMonitor>? You can get it at " +
                "https://github.com/gaearon/redux-devtools-log-monitor."
            );
        } else if (childrenCount > 1 && !props.changeMonitorKey) {
            console.error(
                "You specified multiple monitors inside <DockMonitor> " +
                "but did not provide `changeMonitorKey` prop to change them. " +
                "Try specifying <DockMonitor changeMonitorKey=\"ctrl-m\" /> " +
                "and then press Ctrl-M."
            );
        }
    }

    componentDidMount() {
        window.addEventListener("keydown", this.handleKeyDown);
    }

    componentWillUnmount() {
        window.removeEventListener("keydown", this.handleKeyDown);
    }

    matchesKey(key, event) {
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

    handleKeyDown(e) {
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
        const positionKey = parseKey(this.props.changePositionKey);

        let monitorKey;
        if (this.props.changeMonitorKey) {
            monitorKey = parseKey(this.props.changeMonitorKey);
        }

        if (this.matchesKey(visibilityKey, e)) {
            e.preventDefault();
            this.setState({ isVisible: !this.state.isVisible });
            // this.props.dispatch(toggleVisibility());
        } else if (this.matchesKey(positionKey, e)) {
            e.preventDefault();
            // this.props.dispatch(changePosition());
        } else if (this.matchesKey(monitorKey, e)) {
            e.preventDefault();
            // this.props.dispatch(changeMonitor());
        }
    }

    handleSizeChange(requestedSize) {
        // this.props.dispatch(changeSize(requestedSize));
    }

    renderChild(child, index, otherProps) {
        // const { monitorState } = this.props;
        // const { childMonitorIndex, childMonitorStates } = monitorState;

        // if (index !== childMonitorIndex) {
        //     return null;
        // }

        return cloneElement(child, {
            // monitorState: childMonitorStates[index],
            ...otherProps
        });
    }

    render() {
        const { children, fluid, ...rest } = this.props;
        const { isVisible } = this.state;
        // const { position, isVisible, size } = monitorState;

        return (
            <Dock position="right"
                isVisible={isVisible}
                // size={.3}
                fluid={fluid}
                onSizeChange={this.handleSizeChange}
                dimMode="none">
                {Children.map(children, (child, index) =>
                    this.renderChild(child, index, rest)
                )}
            </Dock>
        );
    }
}