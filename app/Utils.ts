export class Utils {
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    static assign<T, U>(target: T, source: U): T {
        for (let attr in source) {
            target[attr] = source[attr];
        }

        return target;
    }

/*
    static fromJsonFile<T>(filename: string): T {
        var fs = require('fs');
        var obj = JSON.parse(fs.readFileSync(filename, 'utf8'));

        return obj as T;
    };
*/
}