import * as React from 'react'
import * as PropTypes from 'prop-types'
import { Provider } from 'react-redux'
import { Route } from 'react-router-dom'
import App from './App'
import UserPage from './UserPage'
import RepoPage from './RepoPage'
import { DevTools } from "../../devtools";

const Root = ({ store, busDevTools }) => {
  return (
    <Provider store={store}>
      <div>
        <Route path="/" component={App} />
        <Route path="/:login/:name"
          component={RepoPage} />
        <Route path="/:login"
          component={UserPage} />
        <DevTools bus={busDevTools} />
      </div>
    </Provider>
  )
};

Root.propTypes = {
  store: PropTypes.object.isRequired,
}

export default Root
