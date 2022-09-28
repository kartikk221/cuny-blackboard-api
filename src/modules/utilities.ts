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
