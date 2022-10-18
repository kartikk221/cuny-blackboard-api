import { Request, Response } from 'hyper-express';
import { cookies_to_token } from '../../middlewares/require_token';
import { generate_session_cookies } from '../../modules/blackboard/authentication';

export async function login_handler_post(request: Request, response: Response) {
    // Retrieve the username and password from the request body
    const { username = '', password = '' } = (await request.json()) as { username: string; password: string };

    // Ensure that the username is a string(delete this: username is always a string because its coming from the internet) email and not empty
    if (!username || typeof username !== 'string' || !username.includes('@') || !username.includes('.'))
        return response.status(400).json({
            code: 'INVALID_CREDENTIALS',
            message: 'Please provide a valid email / username',
        });

    // Ensure that the password is a string(delete this: password is always a string because its coming from the internet) and not empty
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

    // Convert the cookies to a token
    const token = await cookies_to_token(cookies);

    // Send the token to the client
    response.json({ token });
}
