import fetch from 'cross-fetch';
import { with_retries } from '../utilities';
import { URL_BASE, ERROR_CODES, construct_assignment_id, deconstruct_assignment_id } from './shared';

type api_version = 'v1.private' | 'v1.public' | 'v2.private' | 'v2.public';

/**
 * Performs an API request to the Blackboard Learn REST API.
 *
 * @param api The API version to use
 * @param path The path to the resource
 * @param options The fetch options
 * @param retries Number of times to retry the request
 * @param delay The delay in milliseconds between retries
 * @returns
 */
export async function api_request(
    api: api_version | string,
    path: string,
    options: RequestInit,
    retries = 3,
    delay = 2500
): Promise<Response> {
    // Translate the path based on the API version
    switch (api) {
        case 'v1.private':
            path = `/learn/api/v1${path}`;
            break;
        case 'v1.public':
            path = `/learn/api/public/v1${path}`;
            break;
        case 'v2.private':
            path = `/learn/api/v2${path}`;
            break;
        case 'v2.public':
            path = `/learn/api/public/v2${path}`;
            break;
    }

    // Wrap the request in a retry function
    const output = await with_retries(retries, delay, async () => {
        // Initialize the headers if they don't exist
        if (!options.headers) options.headers = {};

        // Merge defaults with the provided headers
        options.headers = {
            pragma: 'no-cache',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            ...options.headers,
        };

        // Make the fetch request
        const response = await fetch(`${URL_BASE}${path}`, options);

        // Determine if the response returned a 401 Unauthorized
        if (response.status === 401) return new Error(ERROR_CODES.UNAUTHORIZED);

        // Determine if the response returned a 404 Not Found
        if (response.status === 404) return new Error(ERROR_CODES.NOT_FOUND);

        // Return the response to the caller
        return response;
    });

    // If the output is an error, throw it
    if (output instanceof Error) throw output;

    // Otherwise, return the output
    return output;
}

interface User {
    id: string;
    email: string;
    full_name: string;
    username: string;
}

/**
 * Retrieves the user profile from the Blackboard Learn REST API.
 *
 * @param cookies The cookies to use for the request
 * @returns The user's profile
 */
export async function get_user_profile(cookies: string): Promise<User> {
    // Make an API request to the me profile endpoint
    const response = await api_request('v1.private', '/users/me', {
        redirect: 'error', // Don't follow redirects
        headers: {
            cookie: cookies,
        },
    });

    // Parse raw properties from the response body
    const { id, emailAddress, givenName, familyName, userName } = await response.json();

    // Return the profile
    return {
        id,
        email: emailAddress,
        full_name: `${givenName} ${familyName}`,
        username: userName,
    };
}

interface Course {
    id: string;
    url: string;
    name: string;
    code: string;
    description: null | string;
    term: null | {
        id: string;
        name: string;
    };
    enrolled_at: number;
    accessed_at: number;
    updated_at: number;
}

/**
 * Retrieves a user's courses from the Blackboard Learn REST API.
 *
 * @param cookies The cookies to use for the request
 * @returns
 */
export async function get_all_user_courses(cookies: string): Promise<Course[]> {
    // Make an API request to the courses endpoint
    const response = await api_request('v1.private', `/users/me/memberships?expand=course`, {
        redirect: 'error', // Don't follow redirects
        headers: {
            cookie: cookies,
        },
    });

    // parse the paginated results from the response body
    const { results } = await response.json();

    // Parse the results into a list of courses
    const courses: Course[] = [];
    if (Array.isArray(results)) {
        // Loop through the results
        for (const result of results) {
            // Destructure the raw properties from the result
            const { enrollmentDate, lastAccessDate } = result;
            const { id, term, courseId, name, displayName, description, homePageUrl, modifiedDate } = result.course;

            // Build and push the course
            courses.push({
                id,
                url: `${URL_BASE}${homePageUrl}`,
                name: name || displayName,
                code: courseId,
                description: description || null,
                term: term
                    ? {
                          id: term.id,
                          name: term.name,
                      }
                    : null,
                enrolled_at: new Date(enrollmentDate).getTime(),
                accessed_at: new Date(lastAccessDate).getTime(),
                updated_at: new Date(modifiedDate).getTime(),
            });
        }
    }

    // Return the courses
    return courses;
}

interface Announcement {
    id: string;
    title: string;
    body: string;
    created_at: number;
    updated_at: number;
    locations: {
        web?: string;
        file?: string;
    };
}

/**
 * Retrieves all announcements from a course from the Blackboard Learn REST API.
 *
 * @param cookies The cookies to use for the request
 * @param course_id The ID of the course
 */
export async function get_all_course_announcements(cookies: string, course_id: string): Promise<Announcement[]> {
    // Make an API request to the announcements endpoint
    const response = await api_request('v1.private', `/courses/${course_id}/announcements`, {
        redirect: 'error', // Don't follow redirects
        headers: {
            cookie: cookies,
        },
    });

    // Parse the paginated results from the response body
    const { results } = await response.json();

    // Parse the results into a list of announcements
    const announcements: Announcement[] = [];
    if (Array.isArray(results)) {
        // Loop through the results
        for (const result of results) {
            // Destructure the raw properties from the result
            const { id, title, body, createdDate, modifiedDate } = result;

            // Build and push the announcement
            announcements.push({
                id,
                title,
                body: body.displayText || body.rawText,
                created_at: new Date(createdDate).getTime(),
                updated_at: new Date(modifiedDate).getTime(),
                locations: {
                    web: body.webLocation,
                    file: body.fileLocation,
                },
            });
        }
    }

    // Return the announcements
    return announcements;
}

interface SimpleAssignment {
    id: string;
    name: string;
    category: string;
    deadline_at: number;
    grade: {
        score: null | number;
        possible: null | number;
    };
}

/**
 * Retrieves all assignments from a course from the Blackboard Learn REST API.
 *
 * @param course_id The ID of the course
 * @param cookies The cookies to use for the request
 * @returns The assignments in the course
 */
export async function get_all_course_assignments(course_id: string, cookies: string): Promise<SimpleAssignment[]> {
    // Request 1: Get the course's gradebook categories
    // Request 2: Get the course's gradebook columns aka. assignments
    // Request 3: Get the course's gradebook grades for self (the user)
    const responses = await Promise.all(
        [
            ['v1.public', 'categories'],
            ['v2.public', 'columns'],
            ['v2.public', 'users/me'],
        ].map(([api, path]) =>
            api_request(api as api_version, `/courses/${course_id}/gradebook/${path}`, {
                redirect: 'error', // Don't follow redirects
                headers: {
                    cookie: cookies,
                },
            })
        )
    );

    // Parse the results from the responses as JSON
    const [_categories, _assignments, _grades] = await Promise.all(responses.map((response) => response.json()));

    // Parse the results into a list of assignments
    const results: SimpleAssignment[] = [];
    if ([_categories, _assignments, _grades].every((result) => Array.isArray(result.results))) {
        // Parse the categories into a map of category IDs to category names
        const categories = new Map<string, string>();
        for (const category of _categories.results) {
            const { id, title } = category;
            categories.set(id, title);
        }

        // Parse the grades into a map identified by assignment id
        const grades = new Map<string, { scaleType: string; score: number; possible: number }>();
        for (const grade of _grades.results) {
            const { columnId, displayGrade } = grade;
            if (displayGrade) grades.set(columnId, displayGrade);
        }

        // Parse the assignment columns
        const assignments = _assignments.results;
        for (const assignment of assignments) {
            // Destructure the raw properties from the assignment
            const { id, name, grading, score, contentId, externalToolId, gradebookCategoryId = '' } = assignment;

            // Map the assignment to a category and determine an absolute assignment content ID
            const gradeId = id;
            const absoluteId = externalToolId || contentId;
            const category = categories.get(gradebookCategoryId);
            if (category && absoluteId) {
                // Retrieve the associated grade for the assignment
                const grade = grades.get(gradeId);
                results.push({
                    id: construct_assignment_id(absoluteId, gradeId),
                    name,
                    category,
                    deadline_at: new Date(grading.due).getTime(),
                    grade: {
                        score: typeof grade?.score == 'number' ? grade?.score : null,
                        possible: [grade?.possible, score?.possible].find((value) => typeof value == 'number') || null,
                    },
                });
            }
        }
    }

    // Return the assignments
    return results;
}

interface AdvancedAssignment {
    id: string;
    name: string;
    description: string;
    created_at: number;
    updated_at: number;
    attempts: {
        id: string;
        submission: {
            id: null | string;
            body: null | string;
            size: null | number;
        };
        grade: {
            score: null | number;
            feedback: null | string;
        };
        created_at: number;
    }[];
}

export async function get_detailed_assignment(
    course_id: string,
    assignment_id: string,
    cookies: string
): Promise<AdvancedAssignment | void> {
    // De-construct the assignment ID into relevant components
    const { content_id, grade_id } = deconstruct_assignment_id(assignment_id);

    // Retrieve the content of the assignment
    const content = await (
        await api_request('v1.public', `/courses/${course_id}/contents/${content_id}`, {
            redirect: 'error', // Don't follow redirects
            headers: {
                cookie: cookies,
            },
        })
    ).json();

    // Do not return anything, if we do not have view permissions
    if (content.status === 403) return;

    // Instantiate the assignment with basic properties
    const assignment: AdvancedAssignment = {
        id: assignment_id,
        name: content.title,
        description: content.body || content.body.displayText || content.body.rawText,
        created_at: new Date(content.created).getTime(),
        updated_at: new Date(content.modified).getTime(),
        attempts: [],
    };

    // Retrieve the attempts of the assignment
    const attempts = await (
        await api_request('v2.public', `/courses/${course_id}/gradebook/columns/${grade_id}/attempts`, {
            redirect: 'error', // Don't follow redirects
            headers: {
                cookie: cookies,
            },
        })
    ).json();

    // Determine if we received results
    if (Array.isArray(attempts.results))
        attempts.results.forEach((attempt: { [key: string]: any }) => {
            // Destructure the attempt
            const { id, status, created, feedback, displayGrade, attemptReceipt, studentSubmission } = attempt;
            assignment.attempts.push({
                id,
                created_at: new Date(created).getTime(),
                submission: {
                    id: attemptReceipt?.receiptId || null,
                    body: studentSubmission || null,
                    size: attemptReceipt?.submissionTotalSize || null,
                },
                grade: {
                    score: displayGrade?.score || null,
                    feedback: feedback || null,
                },
            });
        });

    return assignment;
}
