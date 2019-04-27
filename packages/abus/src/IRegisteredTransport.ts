import { IMessageTransport } from "./Transports/IMessageTransport";
import { PipelineContext } from "./Pipeline";
export interface IRegisteredTransport {
    transportId: string;
    transport: IMessageTransport;
    pipeline: PipelineContext;
}