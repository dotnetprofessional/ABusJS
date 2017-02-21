/** @internal */
export class Utils {
    /** @internal */
    public static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    };
}