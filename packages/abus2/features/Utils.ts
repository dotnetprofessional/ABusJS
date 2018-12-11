
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export async function waitUntilAsync(condition: Function, timeout: number) {
    const startTime = Date.now();
    while (Date.now() - startTime <= timeout && !condition()) {
        await sleep(5);
    }
}