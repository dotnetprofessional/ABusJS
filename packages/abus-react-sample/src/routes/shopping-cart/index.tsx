import * as React from "react";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import { createLogger } from "redux-logger";
import reducer from "./reducers";
import { getAllProducts } from "./actions";
import { Bus } from "abus";
import App from "./containers/App";
import { composeWithDevTools } from "redux-devtools-extension";
import reduxAbusMiddleware from "redux-abus";
import reduxAbusThunkMiddleware from "redux-abus-thunk";
import { MessageTracingTask } from "../abus-tracing/MessageTracingTask";
import { MessagePerformanceTask } from "../abus-tracing/MessagePerformanceTask";
import { DevTools2, DevToolsTask, AbusMonitorTask } from "abus-devtools";

const bus = new Bus();
const busForDevTools = new Bus();
busForDevTools.start();
bus.start();
bus.usingRegisteredTransportToMessageType("*")
  .outboundPipeline.useLocalMessagesReceivedTasks(new MessageTracingTask()).andAlso()
  // .inboundPipeline.useTransportMessageReceivedTasks(new DevToolsTask(busForDevTools)).andAlso()
  .inboundPipeline.useTransportMessageReceivedTasks(new AbusMonitorTask(busForDevTools)).andAlso()
  .inboundPipeline.useLocalMessagesReceivedTasks(new MessagePerformanceTask());

const devTools = <DevTools2 bus={busForDevTools} toggleVisibilityKey="ctrl-h" />;

const middleWareTest = store => next => action => {
  action.before = "x";
  next(action);
  action.after = "X";
};
const middleware = [reduxAbusThunkMiddleware(bus), reduxAbusMiddleware(bus)];
// const middleware = [thunk, middleWareTest];
if (process.env.NODE_ENV !== "production") {
  middleware.push(createLogger());
}

const composeEnhancers = composeWithDevTools({
  name: "ABUS SAMPLES: Shopping Cart", actionsBlacklist: []
});

const store = createStore(
  reducer, composeEnhancers(
    applyMiddleware(...middleware)
  )
);

var getProductsAPi = getAllProducts();
store.dispatch(getProductsAPi as any);

export class ShoppingCart extends React.Component {
  public render() {
    return (
      <Provider store={store}>
        <App />
        {devTools}
      </Provider>
    );
  }
}
