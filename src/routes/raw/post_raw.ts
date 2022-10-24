import { Request, Response } from 'hyper-express';
import { api_request } from '../../modules/blackboard/methods';

export async function raw_handler_any(request: Request, response: Response) {
    // Retrieve various properties from the request
    const body = request._readable;
    const method = request.method;
    const path = request.path.replace('/raw', '');
    const cookies: string = request.locals.cookies;

    // Parse custom headers with the raw- prefix
    const headers: { [key: string]: string } = {};
    for (const key in request.headers) {
        if (key.startsWith('raw-')) headers[key.replace('raw-', '')] = request.headers[key];
    }

    // Inject the cookies into the headers
    headers['Cookie'] = cookies;

    // Make the API request to Blackboard
    const result = await api_request(
        '',
        path,
        {
            // @ts-expect-error - The request body is a ReadableStream, but the cross-fetch API expects a web ReadableStream
            body,
            method,
            headers,
        },
        0, // No retries as this is a raw request
        0
    );

    // Respond with the result status code and body as text
    response.status(result.status).send(await result.text());
}
