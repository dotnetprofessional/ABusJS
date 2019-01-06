import { TimeSpan } from './Timespan'

export class SendOptions {
    /**
     * specifies the amount of time that should elapse before the message is actually sent
     *
     * @type {TimeSpan}
     * @memberof SendOptions
     */
    public timeToDelay?: TimeSpan;
}