import { CancellationPolicy } from "./CancellationPolicy";

export interface ISubscriptionOptions {
    identifier?: string;
    cancellationPolicy?: CancellationPolicy;
}

