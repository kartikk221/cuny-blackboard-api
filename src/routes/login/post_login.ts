import { Request, Response } from 'hyper-express';
import { cookies_to_token } from '../../modules/blackboard/token';
import { generate_session_cookies, get_cookies_life_details } from '../../modules/blackboard/authentication';

export async function login_handler_post(request: Request, response: Response) {
    // Retrieve the username and password from the request body
    const { username = '', password = '' } = (await request.json()) as { username: string; password: string };

    // Ensure that the username is a string email and not empty
    if (!username || typeof username !== 'string' || !username.includes('@') || !username.includes('.'))
        return response.status(400).json({
            code: 'INVALID_CREDENTIALS',
            message: 'Please provide a valid email / username',
        });

    // Ensure that the password is a string and not empty
    if (!password)
        return response.status(400).json({
            code: 'INVALID_CREDENTIALS',
            message: 'Please provide a valid password',
        });

    // Attempt to generate session cookies for Blackboard
    const cookies = await generate_session_cookies(username, password);

    // If the cookies are null, the credentials are invalid
    if (!cookies)
        return response.status(401).json({
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid username / email or password',
        });

    // Retrieve lifetime details about the cookies
    const lifetime = get_cookies_life_details(cookies);

    // Convert the cookies into header format
    const header = Array.from(cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');

    // Convert the cookies header to a token
    const token = await cookies_to_token(header);

    // Send the token to the client
    response.json({ token, ...lifetime });
}
