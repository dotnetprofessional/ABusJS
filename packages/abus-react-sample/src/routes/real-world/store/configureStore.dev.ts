import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import { createLogger } from 'redux-logger'
import api from '../middleware/api'
import rootReducer from '../reducers'
import reduxAbusThunkMiddleware from "redux-abus-thunk";
import reduxAbusMiddleware from "redux-abus";
import { composeWithDevTools } from 'redux-devtools-extension';

const composeEnhancers = composeWithDevTools({
  name: 'ABUS SAMPLES: Real World', actionsBlacklist: []
});

const configureStore = (bus, preloadedState) => {
  const middleware = [reduxAbusThunkMiddleware(bus), api, reduxAbusMiddleware(bus), createLogger()];
  const store = createStore(
    rootReducer,
    preloadedState,
    composeEnhancers(
      applyMiddleware(...middleware)
    )
  )

  if ((module as any).hot) {
    // Enable Webpack hot module replacement for reducers
    (module as any).hot.accept('../reducers', () => {
      store.replaceReducer(rootReducer)
    })
  }

  return store
}

export default configureStore
