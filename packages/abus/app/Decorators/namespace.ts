/**
 * Allows the overriding of a types namespace with the specified name
 * This only useful if the outputted code will be mangled, which will break
 * the default way of auto discovering the namespace.
 *
 * @export
 * @param {string} type
 * @returns
 */
export function namespace(namespace: string) {
    return function namespace_decorator(target: any) {
        target.prototype["__namespace"] = namespace;
    }
}