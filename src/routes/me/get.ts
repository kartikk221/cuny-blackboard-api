import { Request, Response } from 'hyper-express';
import { get_user_profile } from '../../modules/blackboard/methods';

export async function me_handler_get(request: Request, response: Response) {
    // Retrieve the cookies from the request
    const cookies: string = request.locals.cookies;

    // Retrieve the user's profile
    const profile = await get_user_profile(cookies);

    // Send the profile to the client
    response.json(profile);
}
