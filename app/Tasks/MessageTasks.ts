import { IMessageTask } from "./IMessageTask"

/**
 * Class to manage the message task handlers executed for each message
 *
 * @export
 * @class MessageTasks
 */
export class MessageTasks {
    private _tasks: IMessageTask[];
    private _iterationCount = 0;

    constructor(tasks: IMessageTask[]) {
        this._tasks = tasks;
    }

    // This method is used to get an instance that can be iterated by multiple 'threads'
    public get localInstance(): MessageTasks {
        return new MessageTasks(this._tasks);
    }

    public add(task: IMessageTask) {
        this._tasks.push(task);
    }

    public clear() {
        this._tasks = [];
    }

    public get first(): IMessageTask {
        this._iterationCount = 0;
        return this.next;
    }

    public get next(): IMessageTask {
        if (this._iterationCount >= this._tasks.length) {
            return null;
        }
        else {
            let task = this._tasks[this._iterationCount];
            this._iterationCount++;
            return task;
        };
    }
}