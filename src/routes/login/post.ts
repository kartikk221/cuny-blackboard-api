import zlib from 'zlib';
import { Request, Response } from 'hyper-express';
import { generate_session_cookies } from '../../modules/blackboard/authentication';

export async function login_handler_post(request: Request, response: Response) {
    // Retrieve the username and password from the request body
    const { username = '', password = '' } = await request.json();

    // Ensure that the username is a string email and not empty
    if (!username || typeof username !== 'string' || !username.includes('@') || !username.includes('.'))
        return response.status(400).json({
            code: 'INVALID_CREDENTIALS',
            message: 'Please provide a valid email / username',
        });

    // Ensure that the password is a string and not empty
    if (!password || typeof password !== 'string')
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

    // Compress the cookies string
    zlib.deflate(JSON.stringify(cookies), (error, buffer) => {
        // If there was an error, throw it
        if (error) throw error;

        // Encode the buffer as a base64 string
        response.status(200).json({
            token: buffer.toString('base64'),
        });
    });
}
