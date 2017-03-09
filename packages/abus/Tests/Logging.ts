/*
    This class is used for tracing handlers and other external logging for Saga tests
*/

export default class Log {
    public events: string[] = [];

    info(message: string) {
        this.events.push(message);
    }

    toString() {
        return JSON.stringify(this.events);
    }
}