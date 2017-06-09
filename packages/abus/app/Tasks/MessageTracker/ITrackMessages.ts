import { IMessage } from "../../IMessage";

export interface ITrackMessages {
    trackMessageAsync(message: IMessage<any>);
}