import { Request, Response } from 'hyper-express';

export async function courses_handler_get(request: Request, response: Response) {
    // Retrieve the cookies from the request
    const cookies: string = request.locals.cookies;
}
