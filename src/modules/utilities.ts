/**
 * Returns a Promise that resolves after the given number of milliseconds.
 *
 * @param {Number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Logs specified message to console in an organized log message
 *
 * @param {String} category
 * @param {String} message
 * @returns {void}
 */
export function log(category: string = 'SYSTEM', message: string): void {
    const date = new Date();
    const timestamp = date
        .toLocaleString([], { hour12: true, timeZone: 'America/New_York' })
        .replace(', ', ' ')
        .split(' ');
    timestamp[1] += ':' + date.getMilliseconds().toString().padStart(3, '0') + 'ms';
    console.log(`[${timestamp.join(' ')}][${category}] ${message}`);
}

/**
 * Performs the provided operation with the specified number of retries.
 *
 * @param amount The number of retries to attempt
 * @param delay The number of milliseconds to wait between retries
 * @param operation The operation to retry
 * @param onError Pipe the errors to this function
 */
export async function with_retries(
    amount: number,
    delay: number,
    operation: () => any,
    onError?: (error: Error) => any
): Promise<any> {
    let result;
    try {
        const output = operation();
        if (output instanceof Promise) result = await output;
    } catch (error: any) {
        if (onError) onError(error);
        if (amount > 0) {
            amount--;
            await sleep(delay);
            return await with_retries(amount, delay, operation, onError);
        } else {
            throw error;
        }
    }

    return result;
}
