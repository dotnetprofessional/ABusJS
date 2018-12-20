/*
    DevTools for use with ABUS
*/
import * as React from "react";
import Dock from "react-dock";
import { IBus, IMessageHandlerContext, IMessage, newGuid, IMessageTask } from "abus2";
import "../../devTools.scss";
import {
  Diagram,
  DiagramComponent,
  NodeModel,
  ConnectorModel,
  Node,
  DataBinding,
  HierarchicalTree,
  DiagramTools,
  Inject
} from "@syncfusion/ej2-react-diagrams";

import {
  DataManager
} from '@syncfusion/ej2-data';

export class DevTools extends React.PureComponent<{ bus: IBus }, { isVisible: boolean, toggle: boolean }> {
  private messages: IMessage<any>[] = [];
  private diagramInstance: DiagramComponent;

  constructor(props) {
    super(props)
    this.state = { isVisible: true, toggle: false };
    this.props.bus.start();
    this.processCompletedMessage = this.processCompletedMessage.bind(this);
    this.props.bus.subscribe("abus-devtools-message", this.processCompletedMessage)

    // create the root node
    this.messages.push({ type: "root", messageId: "x", correlationid: "" } as any);
  }

  processCompletedMessage(message: any, context: IMessageHandlerContext) {
    message.messageId = message.metaData.messageId;
    message.correlationId = message.metaData.correlationId || "x";
    this.messages.push(message);
    this.setState({ toggle: !this.state.toggle });
  }

  render() {
    let messageElements: JSX.Element[] = [];
    for (let i = 0; i < this.messages.length; i++) {
      const msg = this.messages[i];
      messageElements.push(<div key={newGuid()}>{msg.type}</div>);
    }

    return (
      <div >
        <Dock position='right' isVisible={this.state.isVisible} dimMode="none">
          {/* you can pass a function as a child here */}
          <div onClick={() => this.setState({ isVisible: !this.state.isVisible })}>X</div>
          <div>ABUS Dev Tools!!!</div>
          {messageElements}
          <DiagramComponent id="diagram"
            ref={diagram => (this.diagramInstance = diagram)}
            width={
              '100%'
            }
            height={
              490
            }
            //Configures data source
            dataSourceSettings={
              {
                id: 'messageId',
                parentId: 'correlationId',
                dataManager: new DataManager(this.messages),
                //binds the external data with node
                doBinding: (nodeModel: NodeModel, data: any, diagram: Diagram) => {
                  nodeModel.annotations = [{
                    /* tslint:disable:no-string-literal */
                    content: data['type'],
                    margin: {
                      top: 10,
                      left: 10,
                      right: 10,
                      bottom: 0
                    },
                    style: {
                      color: 'black'
                    }
                  }];
                  /* tslint:disable:no-string-literal */
                  nodeModel.style = {
                    fill: '#ffeec7',
                    strokeColor: '#f5d897',
                    strokeWidth: 1
                  };
                }
              }
            }
            //Configrues HierarchicalTree layout
            layout={
              {
                type: 'HierarchicalTree',
                horizontalSpacing: 15,
                verticalSpacing: 50,
                orientation: "LeftToRight",
                margin: {
                  top: 10,
                  left: 10,
                  right: 10,
                  bottom: 0
                },
              }
            }
            //Sets the default values of nodes
            getNodeDefaults={
              (obj: Node, diagram: Diagram) => {
                //Initialize shape
                obj.shape = {
                  type: 'Basic',
                  shape: 'Rectangle'
                };
                obj.style = {
                  strokeWidth: 1
                };
                obj.width = 95;
                obj.height = 30;
              }
            }
            //Sets the default values of connectors
            getConnectorDefaults={
              (connector: ConnectorModel, diagram: Diagram) => {
                connector.type = 'Orthogonal';
                connector.style.strokeColor = '#4d4d4d';
                connector.targetDecorator.shape = 'None';
              }
            }
            //Disables all interactions except zoom/pan
            tool={
              DiagramTools.ZoomPan
            }
            snapSettings={
              {
                constraints: 0
              }
            }
          ><Inject services={
            [DataBinding, HierarchicalTree]
          }
            />
          </DiagramComponent>
        </Dock>
      </div>
    );
  }
}

export class DevToolsTask implements IMessageTask {
  constructor(protected bus: IBus) {

  }
  async invokeAsync(message: IMessage<any>, context: IMessageHandlerContext, next: any): Promise<void> {
    await next();
    // Now that handlers have completed sent the message to the devTools.
    this.bus.publishAsync({ type: "abus-devtools-message", payload: message });
  }
}
