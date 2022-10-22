import { Request, Response } from 'hyper-express';
import { cookies_to_token } from '../../../modules/blackboard/token';
import { get_cookies_life_details, refresh_session_cookies } from '../../../modules/blackboard/authentication';

export async function refresh_handler_post(request: Request, response: Response) {
    // Retrieve the cookies from the request
    const current: string = request.locals.cookies;

    // Attempt to refresh the session cookies
    const refreshed = await refresh_session_cookies(current);
    if (refreshed) {
        // Retrieve the store of refreshed cookies
        const { store } = refreshed;

        // Retrieve lifetime details about the cookies
        const lifetime = get_cookies_life_details(store);
        if (lifetime) {
            // Convert the refreshed cookies into a header
            const header = Array.from(store.entries())
                .map(([name, value]) => `${name}=${value}`)
                .join('; ');

            // Convert the cookies header to a token
            const token = await cookies_to_token(header);

            // Send the token to the client along with the lifetime details
            response.json({ token, ...lifetime });
        }
    }

    // If this point is reached, the refresh failed
    return response.status(500).json({
        code: 'REFRESH_FAILED',
        message: 'Failed to refresh session cookies. Please try again later or log in again.',
    });
}
