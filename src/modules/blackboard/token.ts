import zlib from 'zlib';
import { SESSION_COOKIES } from './shared';
import { get_number_hash } from '../utilities';

// Calculate the unique number hash of each cookie
// Sort in ascending hash order to resist changes to the order of the cookies
const hashes: [string, number][] = SESSION_COOKIES.map((cookie) => [cookie, get_number_hash(cookie)]);
hashes.sort((a, b) => a[1] - b[1]);

// Convert the session cookies into a unique lookup map
const lookup = new Map<string | number, number>();
hashes.forEach(([cookie, hash], index) => {
    // Point both the cookie and the hash to the index for fast lookups
    lookup.set(cookie, index);
    lookup.set(hash, index);
});

/**
 * Converts a given string of session cookies header into a unique token.
 *
 * @param cookies The cookies in header format
 * @param encoding The encoding of the token
 * @returns The encoded token
 */
export function cookies_to_token(cookies: string, encoding: BufferEncoding = 'base64') {
    return new Promise((resolve, reject) => {
        // Convert the cookies into encoded indexed values
        const encoded = new Array(SESSION_COOKIES.length);
        cookies.split(';').forEach((cookie) => {
            // Retrieve the cookie name and value
            const [key, value] = cookie.split('=');
            const name = key.trim();

            // Retrieve the index of the cookie and place it at the index
            const index = lookup.get(name);
            if (index !== undefined) encoded[index] = value;
        });

        // Compress the joined encoded values
        zlib.gzip(encoded.join(';'), (error, buffer) => {
            if (error) {
                reject(error);
            } else {
                resolve(buffer.toString(encoding));
            }
        });
    });
}

/**
 * Converts a given unique token into a string of header session cookies.
 *
 * @param token The token to convert
 * @param encoding The encoding of the token
 * @returns The decoded cookies
 */
export function token_to_cookies(token: string, encoding: BufferEncoding = 'base64') {
    return new Promise((resolve, reject) =>
        zlib.unzip(Buffer.from(token, encoding), (error, buffer) => {
            if (error) {
                reject(error);
            } else {
                // Split the decoded values into an array
                const values = buffer.toString().split(';');

                // Convert the indexed values into key-value pairs
                const cookies = values.map((value, index) => {
                    // Ensure this value is hashed
                    if (hashes[index] !== undefined) {
                        // Retrieve the cookie name and value
                        const [name] = hashes[index];
                        return `${name}=${value}`;
                    }
                });

                // Join the cookies into a header string
                resolve(cookies.join('; '));
            }
        })
    );
}
