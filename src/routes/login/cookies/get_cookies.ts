import { Request, Response } from 'hyper-express';
import { get_user_profile } from '../../../modules/blackboard/methods';

export async function cookies_handler_get(request: Request, response: Response) {
    // Retrieve the cookies from the request
    const cookies: string = request.locals.cookies;

    // Retrieve the user's profile to validate the cookies
    await get_user_profile(cookies);

    // If this point is reached, the refresh failed
    return response.json({
        cookies,
    });
}
