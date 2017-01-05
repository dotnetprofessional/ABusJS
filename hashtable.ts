import {Utils} from './Abus'

export class DuplicateException extends Error {
}

interface KeyValuePair<T> {
    key: string;
    value: T;
}

export default class Hashtable<T> {
    private _hash = {};
    private _count: number = 0;
    private _keys: string[] = [];
    private _iteratorCount = 0;

    constructor(hash?: any) {
        if(hash) {
            this._hash = hash;
        }
    }

    add(key: string, value: T): void {
        if (this.contains(key)) {
            throw new TypeError(`The key ${key} already exists..`);
        }

        this._hash[key] = value;
        this._count++;
        this._keys.push(key);
    }

    update(key: string, value: T) {
        if (this.contains(key)) {
            this._hash[key] = value;
        } else {
            this.add(key, value);
        }
    }

    keys(): string[] {
        return this._keys;
    }

    item(key: string): T {
        return this._hash[key];
    }

/* This doesn't seem to be working with es6 and node!? Wait for TS 2.1
    *items() {
        for (var property in this._hash) {
            if (this._hash.hasOwnProperty(property)) {
                yield this.item[property];
            }
        }
    }
*/
    items() {
        let items: T[] = [];
        for (var property in this._hash) {
            if (this._hash.hasOwnProperty(property)) {
                items.push(this.item(property));
            }
        }

        return items;
    }
    remove(key: string) {
        if (this.contains(key)) {
            delete this._hash[key];
            this._count--;

            // remove item from keys collection
            var index = this._keys.indexOf(key, 0);
            if (index > -1) {
                this._keys.splice(index, 1);
            }
        }
    }

    clear(): void {
        this._hash = {};
        this._count = 0;
        this._keys = [];
    }

    get count(): number {
        return this._count;
    }

    contains(key: string): boolean {
        return this._hash[key] !== undefined;
    }

    clone() : Hashtable<any> {
        let copy =  Utils.assign({}, this._hash);
        return new Hashtable(copy);
    }
}

