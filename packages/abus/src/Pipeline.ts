import { IMessageTask } from "./tasks/IMessageTask";

export class PipelineContext {
    public outboundStages: OutboundPipelineStages = new OutboundPipelineStages();
    public inboundStages: InboundPipelineStages = new InboundPipelineStages();
}

export class OutboundPipelineStages {
    public logicalMessageReceived: IMessageTask[] = [];
    public transportDispatch: IMessageTask[] = [];
}

export class InboundPipelineStages {
    public transportMessageReceived: IMessageTask[] = [];
    public logicalMessageReceived: IMessageTask[] = [];
    public invokeHandlers: IMessageTask[] = [];
}