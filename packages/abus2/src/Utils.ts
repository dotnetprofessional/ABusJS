/*
 * Useful functions that don't demand their own file/class
 */

export function getTypeNamespace(typeOrInstance: any): string {
    var proto = typeOrInstance.prototype || Object.getPrototypeOf(typeOrInstance);

    if (proto.__namespace !== undefined && proto.hasOwnProperty("__namespace")) {
        return proto.__namespace;
    }

    var superNamespace = Object.getPrototypeOf(proto).__namespace;
    if (superNamespace !== undefined) {
        return proto.__namespace = superNamespace + "." + proto.constructor.name;
    }

    var nameChain = getTypeNamespaceChain(proto, null);
    nameChain.shift();
    return proto.__namespace = nameChain.join(".");
}

function getTypeNamespaceChain(proto: any, stack: any) {
    stack = stack || [];
    stack.unshift(proto.constructor.name);
    var next = Object.getPrototypeOf(proto);
    return next && getTypeNamespaceChain(next, stack) || stack;
}
