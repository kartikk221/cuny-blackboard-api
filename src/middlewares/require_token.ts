import zlib from 'zlib';
import { Request, Response } from 'hyper-express';

/**
 * Converts a given string of cookies into a token
 *
 * @param cookies The cookies in header format
 * @param encoding The encoding of the token
 * @returns The encoded token
 */
export function cookies_to_token(cookies: string, encoding: BufferEncoding = 'base64') {
    return new Promise((resolve, reject) =>
        zlib.deflate(cookies, (error, buffer) => {
            if (error) {
                reject(error);
            } else {
                resolve(buffer.toString(encoding));
            }
        })
    );
}

/**
 * Converts a given token into a string of cookies
 *
 * @param token The token to convert
 * @param encoding The encoding of the token
 * @returns The decoded cookies
 */
export function token_to_cookies(token: string, encoding: BufferEncoding = 'base64') {
    return new Promise((resolve, reject) =>
        zlib.inflate(Buffer.from(token, encoding), (error, buffer) => {
            if (error) {
                reject(error);
            } else {
                resolve(buffer.toString());
            }
        })
    );
}

export async function use_require_token(request: Request, response: Response) {
    // Retrieve the token from the request headers
    const token = request.headers[process.env['TOKEN_HEADER_NAME'] || ''] as string;
    if (token) {
        // Convert the token into cookies
        const cookies = await token_to_cookies(token);

        // Set the cookies in the request locals
        request.locals.cookies = cookies;
    } else {
        // Return an error to the client as token is invalid
        response.status(401).json({
            code: 'INVALID_TOKEN',
            message: `The provided token is invalid or has expired.`,
        });
    }
}
