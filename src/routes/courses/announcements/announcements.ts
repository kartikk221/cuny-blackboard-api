import { ERROR_CODES } from '../../../modules/blackboard/shared';
import { Request, Response } from 'hyper-express';
import { get_all_course_announcements } from '../../../modules/blackboard/methods';

export async function announcements_handler_get(request: Request, response: Response) {
    // Retrieve course id and cookies from the request
    const cookies: string = request.locals.cookies;
    const course_id = request.path_parameters['course_id'];

    // Throw an error if the course id is invalid
    if (!course_id) throw new Error(ERROR_CODES.NOT_FOUND);

    // Retrieve the user's courses
    const courses = await get_all_course_announcements(cookies, course_id);

    // Return the courses
    return response.json(courses);
}
