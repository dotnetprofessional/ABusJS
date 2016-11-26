/*
    This class is used for tracing handlers and other external logging
*/

export default class Log {
    public events: string[] = [];

    info(message: string) {
        this.events.push(message);
    }

    toString() {
        var text = "";
        this.events.forEach(element => {
            text += element + "\n";
        });

        return text;
    }
}