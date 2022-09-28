import { Request, Response } from 'hyper-express';
import { get_all_course_assignments, get_course_assignment } from '../../../modules/blackboard/methods';

export async function assignments_handler_get(request: Request, response: Response) {
    // Retrieve course id and cookies from the request
    const cookies: string = request.locals.cookies;
    const course_id = request.path_parameters['course_id'];

    // Retrieve the course's assignments
    let assignments;
    try {
        // Throw an error if the course id is invalid
        if (!course_id) throw new Error('BLACKBOARD_API_NOT_FOUND');

        // Retrieve the course's assignments
        assignments = await get_all_course_assignments(course_id, cookies);
    } catch (error: any) {
        if (error.message === 'BLACKBOARD_API_NOT_FOUND')
            return response.status(404).json({
                code: 'NOT_FOUND',
                message: 'The course id you provided does not exist',
            });

        // If the error is not a 404, throw it
        throw error;
    }

    // Return the assignments
    return response.json(assignments);
}

export async function assignment_handler_get(request: Request, response: Response) {
    // Retrieve course id and cookies from the request
    const cookies: string = request.locals.cookies;
    const course_id = request.path_parameters['course_id'];
    const assignment_id = request.path_parameters['assignment_id'];

    // Retrieve the course's assignments
    let assignment;
    try {
        // Throw an error if the course id is invalid
        if (!course_id || !assignment_id) throw new Error('BLACKBOARD_API_NOT_FOUND');

        // Retrieve the course's assignments
        assignment = await get_course_assignment(course_id, assignment_id, cookies);
    } catch (error: any) {
        if (error.message === 'BLACKBOARD_API_NOT_FOUND')
            return response.status(404).json({
                code: 'NOT_FOUND',
                message: 'The course id or assignment id you provided does not exist',
            });

        // If the error is not a 404, throw it
        throw error;
    }

    // Return the assignments
    return response.json(assignment);
}
