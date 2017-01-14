import { Bus } from './ABus'

export function handler(type: string) {
    return function handler_decorator(target: any, key: string) {
        Bus.instance.subscribe({ messageFilter: type, handler: target[key] });
    }
}
