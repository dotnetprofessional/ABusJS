import * as React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import Root from './containers/Root.dev'
import configureStore from './store/configureStore'
import { DevToolsTask } from "../devtools/DevTools";
import { Bus } from 'abus2';
import { MessageTracingTask } from '../abus-tracing/MessageTracingTask';
import { MessagePerformanceTask } from '../abus-tracing/MessagePerformanceTask';

const bus = new Bus();
const busDevTools = new Bus();

bus.start();
bus.usingRegisteredTransportToMessageType("*")
  .outboundPipeline.useLocalMessagesReceivedTasks(new MessageTracingTask()).andAlso()
  .inboundPipeline.useTransportMessageReceivedTasks(new DevToolsTask(busDevTools)).andAlso()
  .inboundPipeline.useLocalMessagesReceivedTasks(new MessagePerformanceTask());

const store = configureStore(bus)

export class RealWorld extends React.Component {
  public render() {
    return (
      <Router>
        <Root store={store} busDevTools={busDevTools} />
      </Router>
    );
  }
}