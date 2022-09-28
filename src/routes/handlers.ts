import { Request, Response } from 'hyper-express';

export function not_found_handler(_: Request, response: Response) {
    response.status(404).json({
        code: 'NOT_FOUND',
        message: 'The requested resource was not found on this server.',
    });
}

export function error_handler(_: Request, response: Response, error: Error) {
    // Handle the known blackboard api unauthorized error
    if (error.name === 'BLACKBOARD_API_UNAUTHORIZED')
        return response.status(401).json({
            code: 'INVALID_TOKEN',
            message: `The provided token is invalid or has expired.`,
        });

    // Log the error to the console
    console.error(error);

    // Send an error response
    response.status(500).json({
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred on the server.',
    });
}
