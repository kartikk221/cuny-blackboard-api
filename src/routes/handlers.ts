import { Request, Response } from 'hyper-express';
import { ERROR_CODES } from '../modules/blackboard/shared';

export function not_found_handler(_: Request, response: Response) {
    response.status(404).json({
        code: 'NOT_FOUND',
        message: 'The requested resource was not found on this server.',
    });
}

export function error_handler(_: Request, response: Response, error: Error) {
    // Handle known errors with custom responses
    switch (error.message) {
        case ERROR_CODES.UNAUTHORIZED:
            return response.status(401).json({
                code: 'INVALID_TOKEN',
                message: `The provided token is invalid or has expired.`,
            });
        case ERROR_CODES.NOT_FOUND:
            return response.status(404).json({
                code: 'NOT_FOUND',
                message: 'The requested resource was not found on Blackboard.',
            });
        case ERROR_CODES.SERVER_ERROR:
            return response.status(500).json({
                code: 'BLACKBOARD_ERROR',
                message: 'An error occurred while communicating with Blackboard. Please try again later.',
            });
    }

    // Log the uncaught error to the console and return a generic error response
    console.error(error);
    response.status(500).json({
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred on the server.',
    });
}
