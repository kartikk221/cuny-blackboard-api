import { Request, Response } from 'hyper-express';
import { cookies_to_token } from '../../../middlewares/require_token';
import { refresh_session_cookies } from '../../../modules/blackboard/authentication';

export async function refresh_handler_post(request: Request, response: Response) {
    // Retrieve the cookies from the request
    const current: string = request.locals.cookies;

    // Attempt to refresh the session cookies
    const refreshed = await refresh_session_cookies(current);
    if (refreshed) {
        // Find the BbRouter cookie from the refreshed cookies
        let bb_router;
        for (const name of refreshed.keys()) {
            if (name.toLowerCase() === 'bbrouter') {
                bb_router = refreshed.get(name);
                break;
            }
        }

        if (bb_router) {
            // Retrieve the properties of the bb router cookie
            const properties = {} as { [key: string]: string };
            bb_router.split(',').forEach((property) => {
                const [key, value] = property.trim().split(':');
                properties[key] = value;
            });

            // Destructure relevant properties to determine expiry and age
            const { expires, timeout } = properties;
            if (expires && timeout) {
                // Convert the second based values to milliseconds
                const age = +timeout * 1000;
                const expires_at = +expires * 1000;

                // Convert the cookies into header format
                const cookies = Array.from(refreshed.entries())
                    .map(([name, value]) => `${name}=${value}`)
                    .join('; ');

                // Convert the cookies into a token
                const token = await cookies_to_token(cookies);

                // Send the token to the client
                return response.json({ token, age, expires_at });
            }
        }
    }

    // If this point is reached, the refresh failed
    return response.status(500).json({
        code: 'REFRESH_FAILED',
        message: 'Failed to refresh session cookies. Please try again later or log in again.',
    });
}
