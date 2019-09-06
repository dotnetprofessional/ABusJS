export enum CancellationPolicy {
    dummy, // typescript is causing issues by ignoring the first item!?
    cancelExisting,
    ignoreIfDuplicate,
    ignoreIfExisting,
}
