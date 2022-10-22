import { Request, Response } from 'hyper-express';
import { api_request } from '../../modules/blackboard/methods';
import { ERROR_CODES } from '../../modules/blackboard/shared';

export async function raw_handler_post(request: Request, response: Response) {
    // Retrieve the cookies
    const cookies: string = request.locals.cookies;

    // Retrieve the body as JSON of various properties
    const { method = 'GET', path, headers, body } = await request.json();

    // Ensure we have a valid endpoint
    if (!path || typeof path !== 'string' || !path.startsWith('/learn')) throw new Error(ERROR_CODES.BAD_REQUEST);

    // Ensure we have valid headers if they were provided
    if (headers !== undefined && typeof headers !== 'object') throw new Error(ERROR_CODES.BAD_REQUEST);

    // Make the API request to Blackboard
    // Do not perform any retries since this is a raw request
    const result = await api_request(
        '',
        path,
        {
            method,
            headers: {
                cookie: cookies,
                ...headers,
            },
            body: typeof body == 'string' ? body : JSON.stringify(body),
        },
        0,
        0
    );

    // Parse headers into an object
    const response_headers = {} as { [key: string]: string };
    result.headers.forEach((value, key) => (response_headers[key] = value));

    // Send the result to the client with the correct status, headers, and body
    response.send(await result.text());
}
