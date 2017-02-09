import { Guid } from './Guid'
import Hashtable from './Hashtable'

export class QueuedMessage {
    constructor(public readonly type: string, public readonly body: any, public metaData: Hashtable<any> = new Hashtable<any>()) {
        // Only set the default meta data if there is none already.
        if (this.metaData.count === 0) {
            this.deliverAt = 0;
        }

        // Some meta data is specific to a QueuedMessage
        // validate that a specific property is set to determine 
        // if its been correctly initialized
        if(!this.id) {
            this.id = Guid.newGuid();
            this.dequeueCount = 0;
            this.timestamp = Date.now();
        }
    }

    public get id() {
        return this.metaData.item('id');
    };
    public set id(value: string) {
        this.metaData.update('id', value);
    };

    public get timestamp() {
        return this.metaData.item('timestamp');
    };
    public set timestamp(value: number) {
        this.metaData.update('timestamp', value);
    };

    public get dequeueCount() {
        return this.metaData.item('dequeueCount');
    };
    public set dequeueCount(value: number) {
        this.metaData.update('dequeueCount', value);
    };

    public get deliverAt() {
        return this.metaData.item('deliverAt');
    };
    public set deliverAt(value: number) {
        this.metaData.update('deliverAt', value);
    };

    clone(): QueuedMessage {
        var msg = new QueuedMessage(this.type, this.body);
        msg.metaData = this.metaData.clone();
        return msg;
    }
}