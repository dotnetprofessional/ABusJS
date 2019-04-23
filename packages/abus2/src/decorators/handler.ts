import { getTypeNamespace } from "../Utils";
import { ISendOptions } from '../ISendOptions';
import { ISubscriptionOptions } from '../ISubscriptionOptions';

/**
 * Defines a function as a message handler which must implement the IMessageHandler interface.
 *
 * @export
 * @param {string} type
 * @returns
 */
export function handler(type: string | Function, options?: ISubscriptionOptions) {
    return function handler_decorator(target: any, key: string, descriptor: PropertyDescriptor) {
        if (typeof (type) === "function") {
            // Will return the full namespace of the type
            type = getTypeNamespace(type);
        }
        var handlers = Object.getOwnPropertyDescriptor(target, "__messageHandlers");
        if (!handlers) {
            // First handler so create a property to store all the handlers
            Object.defineProperty(target, "__messageHandlers", { value: [] });
            Object.defineProperty(target, "__messageHandlerSubscriptions", { value: [] });
        }

        // Record the details of this handler for later binding.
        target["__messageHandlers"].push({ type: type, handler: key, options });

        let originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            return originalMethod.apply(this, args);
        }
    }
}
