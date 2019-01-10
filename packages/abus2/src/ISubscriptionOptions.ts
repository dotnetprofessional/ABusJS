export interface ISubscriptionOptions {
    identifier?: string;
    cancellationPolicy?: CancellationPolicy
}

export enum CancellationPolicy {
    cancelExisting,
    ignoreIfDuplicate,
    ignoreIfExisting
}