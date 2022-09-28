import zlib from 'zlib';
import { Request, Response, MiddlewareNext } from 'hyper-express';

export function use_require_token(request: Request, response: Response, next: MiddlewareNext) {
    // Retrieve the token from the request headers
    const token = request.headers[process.env['TOKEN_HEADER_NAME'] || ''];
    if (token) {
        // Decode the token from base64
        const buffer = Buffer.from(token, 'base64');

        // Decompress the token
        zlib.inflate(buffer, (error, buffer) => {
            // If there was an error, throw it
            if (error) throw error;

            // Parse the cookies string
            const cookies = JSON.parse(buffer.toString());

            // Set the cookies on the request locals
            request.locals.cookies = cookies;

            // Continue to the next middleware
            next();
        });
    } else {
        // Return an error to the client as token is invalid
        response.status(401).json({
            code: 'INVALID_TOKEN',
            message: `The provided token is invalid or has expired.`,
        });
    }
}
