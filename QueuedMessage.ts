import { Guid } from './Guid'
import Hashtable from './Hashtable'

export class QueuedMessage {
    constructor(public readonly type: string, public readonly body: any, public metaData: Hashtable<any> = new Hashtable<any>()) {
        // Only set the default meta data if there is none already.
        if (this.metaData.count === 0) {
            this.messageId = Guid.newGuid();
            this.timestamp = Date.now();
            this.deliverAt = 0;
            this.dequeueCount = 0;
        }
    }

    public get messageId() {
        return this.metaData.item('messageId');
    };
    public set messageId(value: string) {
        this.metaData.update('messageId', value);
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