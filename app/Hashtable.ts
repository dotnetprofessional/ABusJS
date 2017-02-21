export class DuplicateException extends Error {
}

export default class Hashtable<T> {
    private _hash = {};
    private _count: number = 0;
    private _keys: string[] = [];

    constructor(hash?: Object) {
        if (hash) {
            this._hash = hash;
            // Now update the keys and count
            for (let attr in hash) {
                if (hash.hasOwnProperty(attr)) {
                    this._count++;
                    this._keys.push(attr);
                }
            }
        }
    }

    /** @internal */
    public internalHash() {
        return this._hash;
    }

    public add(key: string, value: T): void {
        if (this.contains(key)) {
            throw new TypeError(`The key ${key} already exists..`);
        }

        this._hash[key] = value;
        this._count++;
        this._keys.push(key);
    }

    public update(key: string, value: T) {
        if (this.contains(key)) {
            this._hash[key] = value;
        } else {
            this.add(key, value);
        }
    }

    public keys(): string[] {
        return this._keys;
    }

    public item(key: string): T {
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
    public items() {
        let items: T[] = [];
        for (var property in this._hash) {
            if (this._hash.hasOwnProperty(property)) {
                items.push(this.item(property));
            }
        }

        return items;
    }

    public remove(key: string) {
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

    public clear(): void {
        this._hash = {};
        this._count = 0;
        this._keys = [];
    }

    public get count(): number {
        return this._count;
    }

    public contains(key: string): boolean {
        return this._hash[key] !== undefined;
    }

    public clone(): Hashtable<any> {
        let c = { ...this._hash };
        return new Hashtable(c);
    }
}

