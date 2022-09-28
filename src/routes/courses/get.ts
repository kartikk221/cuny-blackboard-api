import { Request, Response } from 'hyper-express';
import { get_all_user_courses } from '../../modules/blackboard/methods';

export async function courses_handler_get(request: Request, response: Response) {
    // Retrieve the cookies from the request
    const cookies: string = request.locals.cookies;

    // Retrieve the user's courses
    const courses = await get_all_user_courses(cookies);

    // Return the courses
    return response.json(courses);
}
