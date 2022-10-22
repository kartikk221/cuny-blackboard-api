import { Request, Response } from 'hyper-express';
import { token_to_cookies } from '../modules/blackboard/token';

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
