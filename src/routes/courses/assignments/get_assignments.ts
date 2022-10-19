import { ERROR_CODES } from '../../../modules/blackboard/shared';
import { Request, Response } from 'hyper-express';
import { get_all_course_assignments } from '../../../modules/blackboard/methods';

export async function assignments_handler_get(request: Request, response: Response) {
    // Retrieve course id and cookies from the request
    const cookies: string = request.locals.cookies;
    const course_id = request.path_parameters['course_id'];

    // Throw an error if the course id is invalid
    if (!course_id) throw new Error(ERROR_CODES.NOT_FOUND);

    // Retrieve the course's assignments
    const assignments = await get_all_course_assignments(course_id, cookies);

    // Return the assignments
    return response.json(assignments);
}
