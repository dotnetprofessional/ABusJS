import { Bus } from './Bus'

export function handler(type: string) {
    return function handler_decorator(target: any, key: string) {
        Bus.instance.subscribe({ messageFilter: type, handler: target[key] });
    }
}
