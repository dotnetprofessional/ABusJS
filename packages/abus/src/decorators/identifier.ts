/**
 * Allows the overriding of a types identifier with the specified name
 * This is critical if the outputted code will be mangled, which will break
 * the default way of auto discovering the identifier.
 *
 * @export
 * @param {string} type
 * @returns
 */
export function identifier(identifier: string) {
    return function identifier_decorator(target: any) {
        target.prototype["__identifier"] = identifier;
    }
}