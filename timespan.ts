
export default class TimeSpan {
    private _timespan: Date;
    private secondsInMilliseconds = 1000;
    private minutesInMilliseconds = 60 * this.secondsInMilliseconds;
    private hoursInMilliseconds = 60 * this.minutesInMilliseconds;
    private daysInMilliseconds = 24 * this.hoursInMilliseconds;

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
            hours = a;
            minutes = b;
            seconds = c;            
        }

        // Now calculate!
        var ms = days * this.daysInMilliseconds;
        ms += hours * this.hoursInMilliseconds;
        ms += minutes * this.minutesInMilliseconds;
        ms += seconds * this.secondsInMilliseconds;
        ms += milliseconds;
        this._timespan = new Date(ms);
    }

    get days():number {
        return Math.floor(this._timespan.getTime() / this.daysInMilliseconds);
    }

    get totalHours():number {
        return Math.floor(this._timespan.getTime() / this.hoursInMilliseconds);
    }

    get totalMinutes():number {
        return Math.floor(this._timespan.getTime() / this.minutesInMilliseconds);
    }

    get totalSeconds():number {
        return Math.floor(this._timespan.getTime() / this.secondsInMilliseconds);
    }

    get totalMilliseconds():number {
        return Math.floor(this._timespan.getTime());
    }
    
    static FromHours(hours: number): TimeSpan {
        return new TimeSpan(hours,0,0);
    }
    static FromMinutes(minutes: number): TimeSpan {
        return new TimeSpan(0,minutes,0);
    }
    static FromSeconds(seconds: number): TimeSpan {
        return new TimeSpan(0,0,seconds);
    }
}
