import { Bus } from './Bus'

/**
 * Defines a function as a message handler which must implement the IMessageHandler interface.
 *
 * @export
 * @param {string} type
 * @returns
 */
export function handler(type: string | Function) {
    return function handler_decorator(target: any, key: string) {
        if (typeof (type) === "function") {
            // Will return the full namespace of the type
            type = Bus.instance.getTypeNamespace(type);
        }

        var handlers = Object.getOwnPropertyDescriptor(target, "__messageHandlers");
        if (!handlers) {
            // First handler so create a property to store all the handlers
            Object.defineProperty(target, "__messageHandlers", { value: [] });
        }

        // Record the details of this handler for later binding.
        target["__messageHandlers"].push({ type: type, handler: key });
    }
}

/**
 * Defines that this class contains message handlers
 * if no messages handlers are defined an exception will be thrown.
 *
 * @export
 * @param {*} target
 * @returns
 */
export function iHandleMessages(target: any) {
    // save a reference to the original constructor
    var original = target;

    // a utility function to generate instances of a class
    function construct(constructor, args) {
        var c: any = function () {
            // Locate any handlers that were defined using @handler
            // then subscribe to the bus with the binding the current class instance
            var handlers = target.prototype["__messageHandlers"] as Array<any>;
            if (!handlers) {
                throw new TypeError("iHandleMessages defined on class that has no handlers defined.");
            }

            handlers.map(handler => {
                Bus.instance.subscribe({ messageFilter: handler.type, handler: this[handler.handler].bind(this) });
            });

            //NB: These __messageHandlers can't be removed once used as they are on the prototype and
            //    are required for every class instance that is created.

            return constructor.apply(this, args);
        }
        c.prototype = constructor.prototype;
        return new c();
    }

    // the new constructor behaviour
    var f: any = function (...args) {
        return construct(original, args);;
    }
    // copy prototype so instance of operator still works
    f.prototype = original.prototype;

    // return new constructor (will override original)
    return f;
}
