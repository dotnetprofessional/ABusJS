import * as React from 'react'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import { createLogger } from 'redux-logger'
import thunk from 'redux-thunk'
import reducer from './reducers'
import { getAllProducts } from './actions'
import { Bus, IBus, IMessageTask, IMessage, IMessageHandlerContext, IBusMetaData, newGuid, Intents } from "abus2";
import App from './containers/App'
import { composeWithDevTools } from 'redux-devtools-extension';
import { DevTools, DevToolsTask } from "../devtools/DevTools";
import reduxAbusMiddleware from "redux-abus";
import reduxAbusThunkMiddleware from "redux-abus-thunk";
import { MessageTracingTask } from '../abus-tracing/MessageTracingTask';
import { MessagePerformanceTask } from '../abus-tracing/MessagePerformanceTask';

const bus = new Bus();
const busDevTools = new Bus();
bus.start();
bus.usingRegisteredTransportToMessageType("*")
  .outboundPipeline.useLocalMessagesReceivedTasks(new MessageTracingTask()).andAlso()
  .inboundPipeline.useTransportMessageReceivedTasks(new DevToolsTask(busDevTools)).andAlso()
  .inboundPipeline.useLocalMessagesReceivedTasks(new MessagePerformanceTask());

const devTools = <DevTools bus={busDevTools} />;


const middleWareTest = store => next => action => {
  action.before = "x";
  next(action);
  action.after = "X";
}
const middleware = [reduxAbusThunkMiddleware(bus), reduxAbusMiddleware(bus)];
// const middleware = [thunk, middleWareTest];
if (process.env.NODE_ENV !== 'production') {
  middleware.push(createLogger());
}

const composeEnhancers = composeWithDevTools({
  name: 'ABUS SAMPLES: Shopping Cart', actionsBlacklist: []
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
