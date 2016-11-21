import * as abus from './Abus';
import TimeSpan from './TimeSpan'

export class Saga<T> {
    isComplete: boolean;

    markAsComplete(): void {

    }

    /**
     * @param message : IMessage<T> message to recieve after timeout has expired
     * @param delay : Date the date and time the message should be delivered or a TimeSpan
     */
    requestTimeout(message: abus.IMessage<T>, delay: TimeSpan | Date) {
        
    }
}

export interface IPersistSagaData {

     Save() : Promise<void>;
     Update() : Promise<void>;
     Get<T>() : Promise<T>;
     Complete() : Promise<void>;
}