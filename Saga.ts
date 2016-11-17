import * as abus from './Abus';

export class TimeSpan {

    constructor(hours: number, minutes: number, seconds: number);
    constructor(days: number, hours: number, minutes: number, seconds: number);
    constructor(days: number, hours: number, minutes: number, seconds: number, milliseconds: number);
    constructor(a: number, b: number, c: number, d?: number, e?: number) {
        let days = 0, hours = 0, minutes = 0, seconds = 0, milliseconds = 0;

        if (e != undefined) { // All options selected
            days = a;
            hours = b;
            minutes = c;
            seconds = d;
            milliseconds = e;
        } else if (d != undefined) { //days, hours, minutes, seconds
            days = a;
            hours = b;
            minutes = c;
            seconds = d;
        } else { // Only option left is hours, minutes, seconds
            hours = b;
            minutes = c;
            seconds = d;            
        }

        // Now calculate!
    }
}
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