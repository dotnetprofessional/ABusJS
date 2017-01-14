import TimeSpan from './timespan'

export class SendOptions {
    deliverIn?: TimeSpan;
    // deliverAt?: Date; // Enable when able to persist messages
}