import { TimeSpan } from './Timespan'
import { CancellationToken } from './CancellationToken';

export interface ISendOptions {
    /**
     * specifies the amount of time that should elapse before the message is actually sent
     *
     * @type {TimeSpan}
     * @memberof SendOptions
     */
    timeToDelay?: TimeSpan;

    /**
     * Provides a finite amount of time for the request to resolve. If the request takes longer
     * than the specified timeout, a timeout exception will be thrown.
     * default: 60 seconds
     *
     * @type {TimeSpan}
     * @memberof ISendOptions
     */
    timeout?: TimeSpan;

    /**
     * Provides the ability to cancel the request prior to the response being received.
     * The request itself cannot be cancelled, however, an exception will be thrown when the request
     * resolves. This provides the ability to cancel a series of requests externally.
     *
     * @type {CancellationToken}
     * @memberof ISendOptions
     */
    cancellationToken?: CancellationToken;
}

