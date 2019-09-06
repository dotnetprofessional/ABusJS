import * as React from "react";
// import { render } from 'react-dom'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import rootReducer from './reducers'
import { App } from "./components/App";
import { composeWithDevTools } from 'redux-devtools-extension';
import { Bus, IMessageHandlerContext } from "abus";
import reduxAbusMiddleware from "redux-abus";

import * as actions from "./actions";

const bus = new Bus();
bus.start();

bus.subscribe("SET_VISIBILITY_FILTER", (message, context) => {
  console.log("Adding a new TODO: " + message.text);
  context.publishAsync({ type: "test_message", payload: "test" });

  // Add a few more TODOs 
  for (let i = 0; i < 5; i++) {
    context.publishAsync(actions.addTodo("more: " + i));
  }
});

const composeEnhancers = composeWithDevTools({
  name: 'ABUS SAMPLES: TODOs', actionsBlacklist: []
});

const store = createStore(rootReducer, composeEnhancers(
  applyMiddleware(reduxAbusMiddleware(bus)),
  // other store enhancers if any
));

export class Listing extends React.Component {
  public render() {
    return (
      <Provider store={store}>
        <App />
      </Provider>
    );
  }
}
