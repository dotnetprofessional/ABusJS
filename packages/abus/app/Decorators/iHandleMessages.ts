import { Bus } from '../Bus'

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
            let newClass = new target(...args);
            // Locate any handlers that were defined using @handler
            // then subscribe to the bus with the binding the current class instance
            var handlers = target.prototype["__messageHandlers"] as Array<any>;
            var handlerSubscriptionKeys = target.prototype["__messageHandlersSubscriptions"] as Array<any>;
            if (!handlers) {
                throw new TypeError("iHandleMessages defined on class that has no handlers defined.");
            }

            handlers.map(handler => {
                // Register a handler and record the subscription key for later removal
                handlerSubscriptionKeys.push(Bus.instance.subscribe({ messageFilter: handler.type, handler: newClass[handler.handler].bind(newClass) }));
            });

            //NB: These __messageHandlers can't be removed once used as they are on the prototype and
            //    are required for every class instance that is created.

            //return constructor.apply(this, args);
            return newClass;
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