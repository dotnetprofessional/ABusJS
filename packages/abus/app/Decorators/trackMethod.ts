
import { TrackingMessage, MessageTrackerTask } from "../index";

// Decorator that wraps a method to track the time the method took
export function trackMethod() {
    function completeTracking(message: TrackingMessage) {
        message.endProcessing = Date.now();
        message.action = "complete";
        MessageTrackerTask.instance.trackTrackingMessage(message);
    }

    function errorTracking(message: TrackingMessage, error: any) {
        message.action = "error";
        message.metaData.add("error", error);
        message.endProcessing = Date.now();
        MessageTrackerTask.instance.trackTrackingMessage(message);
    }

    return function trackMethod_Decorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        let originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            const trackingMessage = new TrackingMessage();
            if (this.currentHandlerContext) {
                trackingMessage.correlationId = this.currentHandlerContext.messageId;
            }
            trackingMessage.process = propertyKey;
            trackingMessage.startProcessing = Date.now();
            try {
                let result = originalMethod.apply(this, args);

                if (result && result["then"]) {
                    // this is a promise
                    return result.then((promiseResult) => {
                        completeTracking(trackingMessage);
                        return promiseResult;
                    }, (error) => {
                        errorTracking(trackingMessage, error);
                        throw error;
                    });
                }

                // It is not a promise
                completeTracking(trackingMessage);
                return result;
            } catch (error) {
                errorTracking(trackingMessage, error);
                throw error;
            }
        };
    };
}