import { ERROR_CODES } from '../../../modules/blackboard/shared';
import { Request, Response } from 'hyper-express';
import { get_detailed_assignment } from '../../../modules/blackboard/methods';

export async function specific_assignment_handler_get(request: Request, response: Response) {
    // Retrieve course id and cookies from the request
    const cookies: string = request.locals.cookies;
    const course_id = request.path_parameters['course_id'];
    const assignment_id = request.path_parameters['assignment_id'];

    // Throw an error if either course or assignment id is invalid
    if (!course_id || !assignment_id) throw new Error(ERROR_CODES.NOT_FOUND);

    // Retrieve the assignment's details
    const assignment = await get_detailed_assignment(course_id, assignment_id, cookies);
    if (!assignment) throw new Error(ERROR_CODES.NOT_ALLOWED);

    // Return the assignment
    return response.json(assignment);
}
