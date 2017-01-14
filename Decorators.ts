import { Bus } from './ABus'

export function log(target: Function, key: string, value: any) {
    return {
        value: function (...args: any[]) {
            var a = args.map(a => JSON.stringify(a)).join();
            var result = value.value.apply(this, args);
            var r = JSON.stringify(result);
            console.log(`Call: ${key}(${a}) => ${r}`);
            return result;
        }
    };
}

export function handler(type: string) {
    return function handler_decorator(target: any, key: string, value: any) {
        Bus.instance.subscribe({ messageFilter: type, handler: target[key] });
    }
}
