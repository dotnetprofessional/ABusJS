import { MetaData } from "../../MetaData";
/**
 * Represents a message that is used for tracking purposes. These messages should not go through
 * the main bus pipeline. That are designed to be a very light weight way to augment the pipeline for
 * tracking purposes.
 *
 * @export
 * @class TrackingMessage
 */
export class TrackingMessage {

    constructor() {
        this.metaData = new MetaData;
    }
    /**
     * Used as the identifier of the message
     *
     * @type {string}
     * @memberOf TrackingMessage
     */
    public process: string;

    public action: string;

    public startProcessing: number;

    public endProcessing: number;

    public correlationId: string;

    public metaData: MetaData;
}
