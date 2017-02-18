export class Utils {
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    };
}