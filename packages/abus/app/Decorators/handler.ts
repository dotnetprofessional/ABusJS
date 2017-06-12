import { Bus } from "../Bus";

/**
 * Defines a function as a message handler which must implement the IMessageHandler interface.
 *
 * @export
 * @param {string} type
 * @returns
 */
export function handler(type: string | Function) {
    return function handler_decorator(target: any, key: string, descriptor: PropertyDescriptor) {
        if (typeof (type) === "function") {
            // Will return the full namespace of the type
            type = Bus.instance.getTypeNamespace(type);
        }

        var handlers = Object.getOwnPropertyDescriptor(target, "__messageHandlers");
        if (!handlers) {
            // First handler so create a property to store all the handlers
            Object.defineProperty(target, "__messageHandlers", { value: [] });
            Object.defineProperty(target, "__messageHandlersSubscriptions", { value: [] });
            target.unsubscribeHandlers = function () {
                for (let i = 0; i < this.__messageHandlersSubscriptions.length; i++) {
                    Bus.instance.unsubscribe(this.__messageHandlersSubscriptions[i]);
                }
            }
        }

        // Record the details of this handler for later binding.
        target["__messageHandlers"].push({ type: type, handler: key });

        let originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            this.currentHandlerContext = args[1];
            return originalMethod.apply(this, args);
        }
    }
}