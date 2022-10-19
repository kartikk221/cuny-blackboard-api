import fetch from 'cross-fetch';
import { with_retries } from '../utilities';
import * as HTMLParser from 'node-html-parser';
import { URL_BASE, USER_AGENT, ERROR_CODES } from './shared';

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
    api: api_version,
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
        default:
            throw new Error(`Invalid API version: ${api}`);
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
    last_accessed_at: number;
    last_modified_at: number;
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
                last_accessed_at: new Date(lastAccessDate).getTime(),
                last_modified_at: new Date(modifiedDate).getTime(),
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
    created_at?: number;
    modified_at?: number;
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
                modified_at: new Date(modifiedDate).getTime(),
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

interface Assignment {
    id: string;
    url: null | string;
    name: string;
    status: string;
    position: number;
    updated_at: number;
    deadline_at: number;
    grade: {
        score: null | number;
        possible: null | number;
        feedback: null | string;
    };
}

/**
 * Retrieves all assignments from a course from the Blackboard Learn REST API.
 *
 * @param course_id The ID of the course
 * @param cookies The cookies to use for the request
 * @returns The assignments in the course
 */
export async function get_all_course_assignments(course_id: string, cookies: string): Promise<Assignment[]> {
    // Make a GET request to the Blackboard myGrades stream Viewer
    // This is the best way to get the most data per assignment in a single request
    // Note! This page can randomly fail to load, so we retry a few times
    const response = await fetch(
        `${URL_BASE}/webapps/bb-mygrades-bb_bb60/myGrades?course_id=${course_id}&stream_name=mygrades`,
        {
            redirect: 'manual', // Don't follow redirects
            headers: {
                cookie: cookies,
                pragma: 'no-cache',
                'cache-control': 'no-cache',
                'user-agent': USER_AGENT,
            },
        }
    );

    // If the response redirects to the login page, the cookies are invalid
    if (response.status === 302) throw new Error(ERROR_CODES.UNAUTHORIZED);

    // Parse the HTML from the response body into a DOM
    const body = await response.text();

    // Safely parse the HTML into a set of assignments
    const assignments: Assignment[] = [];
    try {
        // Parse the HTML into a DOM model
        const html = HTMLParser.parse(body);

        // Iterate through all columns in the table
        const columns = html.querySelectorAll('[duedate]');
        for (const column of columns) {
            // Retrieve various properties about each cell
            const id = column.getAttribute('id');
            const position = +(column.getAttribute('position') || 0);
            const updated_at = +(column.getAttribute('lastactivity') || 0);
            const deadline_at = +(column.getAttribute('duedate') || 0);
            if (id && position && updated_at && deadline_at && deadline_at.toString().length <= 15) {
                // Parse the column's cells to retrieve specific data
                const cells = column.querySelectorAll('.cell');

                // Parse the URL from the first cell
                let url = null;
                const link = cells[0].querySelector('a');
                if (link) {
                    // Use a default URL if the link parsing fails
                    url = `${URL_BASE}/webapps/assignment/uploadAssignment?action=showHistory&course_id=${course_id}&outcome_definition_id=_${id}_1`;

                    // Use the onclick attribute to parse the URL
                    const onclick = link.getAttribute('onclick');
                    if (onclick) {
                        // Parse the raw URL
                        const [_, raw] = onclick.split("'");
                        if (raw) url = `${URL_BASE}${raw}`;
                    }
                }

                // Parse the name of the assignment/type from the first cell
                const [title, deadline_readable, type] = cells[0].innerText.split('\n').filter((c) => c.trim());
                const name = `${title.trim()} (${(type || 'Resource').trim()})`;

                // Parse the status of the assignment from the second cell
                // Note! Upcoming assignments don't have a updated readable hence the OR operators
                const [updated_readable, raw_status] = cells[1].innerText.split('\n').filter((c) => c.trim());
                const status = (raw_status || updated_readable || 'UPCOMING').trim().toUpperCase();

                // Parse the grade object from the third cell
                const [score, possible] = cells[2].innerText
                    .split('\n')
                    .join('')
                    .split('/')
                    .filter((c) => c);
                const grade = {
                    score: isNaN(+score) ? null : +score,
                    possible: isNaN(+possible) ? null : +possible,
                };

                // Parse the feedback from the third cell if we have a grade score
                let feedback = null;
                if (grade.score) {
                    // Determine if the feedback popup button exists
                    const button = cells[2].querySelector('a');
                    if (button) {
                        // Parse the feedback from the onclick attribute
                        const onclick = button.getAttribute('onclick');
                        if (onclick) {
                            // Attempt to parse the onclick parameter string which contains HTML aka. the feedback
                            const raw = onclick.split(',').filter((part) => part.includes('<div'))[0];
                            if (raw) {
                                // Split by the first closing of HTML tag
                                const chunks = raw.split('>');

                                // Remove the first chunk which is the HTML tag
                                chunks.shift();

                                // Split by the last closing of HTML tag
                                const chunks2 = chunks.join('>').split('</');

                                // Remove the last chunk which is the HTML tag
                                chunks2.pop();

                                // Stich the remaining chunks back together
                                const stiched = chunks2.join('</').trim();

                                // Remove unnecessary whitespaces and newlines
                                feedback = stiched
                                    .split('\\n')
                                    .filter((c) => c.trim().length)
                                    .join('\n')
                                    .trim();
                            }
                        }
                    }
                }

                // Build and push the assignment
                assignments.push({
                    id,
                    url,
                    name,
                    status,
                    position,
                    updated_at,
                    deadline_at,
                    grade: {
                        ...grade,
                        feedback,
                    },
                });
            }
        }

        // Sort the assignments by their position
        assignments.sort((a, b) => a.position - b.position);
    } catch (error) {
        throw new Error(ERROR_CODES.SERVER_ERROR);
    }

    return assignments;
}
