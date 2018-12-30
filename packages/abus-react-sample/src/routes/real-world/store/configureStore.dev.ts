import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import { createLogger } from 'redux-logger'
import api from '../middleware/api'
import rootReducer from '../reducers'
import reduxAbusThunkMiddleware from "redux-abus-thunk";
import reduxAbusMiddleware from "redux-abus";

const configureStore = (bus, preloadedState) => {
  const store = createStore(
    rootReducer,
    preloadedState,
    compose(
      applyMiddleware(reduxAbusThunkMiddleware(bus), api, reduxAbusMiddleware(bus), createLogger())
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
