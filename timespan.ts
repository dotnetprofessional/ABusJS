
export default class TimeSpan {
    private _timespan: number;
    private secondsInMilliseconds = 1000;
    private minutesInMilliseconds = 60 * this.secondsInMilliseconds;
    private hoursInMilliseconds = 60 * this.minutesInMilliseconds;
    private daysInMilliseconds = 24 * this.hoursInMilliseconds;

    constructor(milliseconds: number);
    constructor(hours: number, minutes: number, seconds: number);
    constructor(days: number, hours: number, minutes: number, seconds: number);
    constructor(days: number, hours: number, minutes: number, seconds: number, milliseconds: number);
    constructor(a: number, b?: number, c?: number, d?: number, e?: number) {
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
        } else if (c != undefined) { // hours, minutes, seconds
            hours = a;
            minutes = b;
            seconds = c;            
        } else {
            milliseconds = a;
        }

        // Now calculate!
        var ms = days * this.daysInMilliseconds;
        ms += hours * this.hoursInMilliseconds;
        ms += minutes * this.minutesInMilliseconds;
        ms += seconds * this.secondsInMilliseconds;
        ms += milliseconds;
        this._timespan = ms;
    }

    get days():number {
        return Math.floor(this._timespan / this.daysInMilliseconds);
    }

    get totalHours():number {
        return Math.floor(this._timespan / this.hoursInMilliseconds);
    }

    get totalMinutes():number {
        return Math.floor(this._timespan / this.minutesInMilliseconds);
    }

    get totalSeconds():number {
        return Math.floor(this._timespan / this.secondsInMilliseconds);
    }

    get totalMilliseconds():number {
        return Math.floor(this._timespan);
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

    /**
     * 
     * Converts the TimeSpan to a point in time based on the current
     * date and time. The returned value is a time value that is the 
     * number of milliseconds since 1 January, 1970 UTC.
     * @returns {number}
     * 
     * @memberOf TimeSpan
     */
    getDateTime(): number {
        return Date.now() + this._timespan;
    }

    /**
     * Used to convert the passed in date to a TimeSpan based on the current
     * date and time.
     * 
     * @param {number} date
     * 
     * @memberOf TimeSpan
     */
    static getTimeSpan(date: number): TimeSpan {
        return new TimeSpan(Date.now() - date); 
    }
}
