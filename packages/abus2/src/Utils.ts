/*
 * Useful functions that don't demand their own file/class
 */

export function getTypeNamespace(typeOrInstance: any): string {
    var proto = typeOrInstance.prototype || Object.getPrototypeOf(typeOrInstance);

    if (proto.__identifier !== undefined && proto.hasOwnProperty("__identifier")) {
        return proto.__identifier;
    }

    var superNamespace = Object.getPrototypeOf(proto).__identifier;
    if (superNamespace !== undefined) {
        return proto.__identifier = superNamespace + "." + proto.constructor.name;
    }

    var nameChain = getTypeNamespaceChain(proto, null);
    nameChain.shift();
    return proto.__identifier = nameChain.join(".");
}

function getTypeNamespaceChain(proto: any, stack: any) {
    stack = stack || [];
    stack.unshift(proto.constructor.name);
    var next = Object.getPrototypeOf(proto);
    return next && getTypeNamespaceChain(next, stack) || stack;
}
