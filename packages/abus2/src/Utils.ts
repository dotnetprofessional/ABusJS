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

const hasOwn = Object.prototype.hasOwnProperty;

function is(x, y) {
    if (x === y) {
        return x !== 0 || y !== 0 || 1 / x === 1 / y;
    } else {
        return x !== x && y !== y;
    }
}

// lifted from https://github.com/reduxjs/react-redux/blob/master/src/utils/shallowEqual.js
export function shallowEqual(objA: any, objB: any): boolean {
    if (is(objA, objB)) { return true; }

    if (
        typeof objA !== "object" ||
        objA === null ||
        typeof objB !== "object" ||
        objB === null
    ) {
        return false;
    }

    const keysA = Object.keys(objA).filter(item => item !== "metaData");
    const keysB = Object.keys(objB).filter(item => item !== "metaData");

    // remove the meta-data keys as they will always be different
    delete keysA["metaData"];
    delete keysB["metaData"];

    if (keysA.length !== keysB.length) { return false; }

    for (let i = 0; i < keysA.length; i++) {
        if (!hasOwn.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) {
            return false;
        }
    }

    return true;
}