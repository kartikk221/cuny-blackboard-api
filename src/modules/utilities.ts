export const EMAIL_REGEX =
    /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

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
