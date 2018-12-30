/*
    DevTools for use with ABUS
*/
import * as React from "react";
import * as ReactDom from "react-dom";
import Dock from "react-dock";
import { IBus, IMessageHandlerContext, IMessage, newGuid, IMessageTask, handler } from "abus2";
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
  Inject,
  GridlinesModel,
  DiagramConstraints,
  NodeConstraints
} from "@syncfusion/ej2-react-diagrams";
import JSONTree from 'react-json-tree'

import {
  DataManager
} from '@syncfusion/ej2-data';

export class DevTools extends React.PureComponent<{ bus: IBus }, { isVisible: boolean, toggle: boolean }> {
  private messages: IMessage<any>[] = [];
  private diagramInstance: DiagramComponent;
  private subscriptionId: string;
  private wasMounted: boolean = false;

  private interval: number[] = [
    1,
    9,
    0.25,
    9.75,
    0.25,
    9.75,
    0.25,
    9.75,
    0.25,
    9.75,
    0.25,
    9.75,
    0.25,
    9.75,
    0.25,
    9.75,
    0.25,
    9.75,
    0.25,
    9.75
  ];
  constructor(props) {
    super(props)
    this.props.bus.start();
    this.updateDiagram = this.updateDiagram.bind(this);
    this.processCompletedMessage = this.processCompletedMessage.bind(this);
    this.handleSizeChange = this.handleSizeChange.bind(this);
    this.state = { isVisible: true, toggle: false };
    this.messages.push({ type: "root", messageId: "root", correlationid: "", metaData: {} } as any);
  }

  componentWillUnmount() {
    this.props.bus.unregisterHandlers(this);
  }

  componentDidMount() {
    this.props.bus.registerHandlers(this);
    this.wasMounted = true;
  }

  @handler("abus-devtools-message")
  processCompletedMessage(message: any, context: IMessageHandlerContext) {
    message.messageId = message.metaData.messageId;
    message.correlationId = message.metaData.correlationId || "root";
    this.messages.push(message);
    this.updateDiagram();
  }

  handleSizeChange() {
    // this.updateDiagram();
  }

  updateDiagram() {
    if (this.wasMounted) {
      this.setState({ toggle: !this.state.toggle });
      // this.diagramInstance.dataBind();
    }
  }

  render() {
    let messageElements: JSX.Element[] = [];
    // for (let i = 0; i < this.messages.length; i++) {
    //   const msg = this.messages[i];
    //   messageElements.push(<div key={newGuid()}>{msg.type}</div>);
    // }

    let gridlines: GridlinesModel = {
      lineColor: "#e0e0e0",
      lineIntervals: this.interval
    };

    const getNodeData = (node: Node): IMessage<any> => {
      return this.messages.filter((m: any) => m.messageId === node.data["messageId"])[0];
    }
    function getContent(data: IMessage<any>): HTMLElement {
      let tooltipContent: HTMLElement = document.createElement('div');
      let content = (
        <React.Fragment>
          <div>TYPE: {data.type} </div>
          <JSONTree data={data} />
        </React.Fragment>
      );
      ReactDom.render(content, tooltipContent)
      return tooltipContent;
    }

    return (
      <div >
        <Dock position='right' isVisible={this.state.isVisible} dimMode="none" onSizeChange={this.handleSizeChange}
          fluid={true}>
          {/* you can pass a function as a child here */}
          <div onClick={() => this.setState({ isVisible: !this.state.isVisible })}>X</div>
          <div>ABUS Dev Tools!!!</div>
          {messageElements}
          <DiagramComponent id="diagram"
            ref={diagram => { this.diagramInstance = diagram }}
            width={'100%'}
            height={490}
            snapSettings={{
              horizontalGridlines: gridlines,
              verticalGridlines: gridlines
            }}
            click={(args) => {
              debugger;
            }}
            //Configures data source
            dataSourceSettings={
              {
                id: 'messageId',
                parentId: 'correlationId',
                dataManager: new DataManager(this.messages),
                //binds the external data with node
                doBinding: (nodeModel: NodeModel, data: any, diagram: Diagram) => {
                  // debugger;
                  nodeModel.annotations = [{
                    /* tslint:disable:no-string-literal */
                    margin: {
                      top: 10,
                      left: 10,
                      right: 10,
                      bottom: 10
                    },
                    style: {
                      color: 'black'
                    }
                  }];
                  /* tslint:disable:no-string-literal */
                  nodeModel.style = {
                    strokeColor: '#f5d897',
                    strokeWidth: 1,
                  };
                  nodeModel.constraints = NodeConstraints.Default | NodeConstraints.Tooltip
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
                const msg = getNodeData(obj);
                //Initialize shape
                obj.shape = {
                  type: 'Basic',
                  shape: 'Rectangle'
                };
                obj.style = {
                  strokeWidth: 1,
                  fill: msg.metaData["isSynthetic"] ? 'lightblue' : '#ffeec7',
                };
                obj.height = 30;
                obj.annotations = [{
                  content: msg.type,
                }]
                obj.width = msg.type.length * 10;
                obj.tooltip = {
                  //Sets the content of the Tooltip
                  content: getContent(msg),
                  //Sets the position of the Tooltip
                  position: 'BottomCenter',
                  //Sets the tooltip position relative to the node
                  relativeMode: 'Object'
                }

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

            constraints={
              DiagramConstraints.Default | DiagramConstraints.Tooltip
            }
          ><Inject services={
            [DataBinding, HierarchicalTree]
          }
            />
          </DiagramComponent>
        </Dock>
      </div >
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
