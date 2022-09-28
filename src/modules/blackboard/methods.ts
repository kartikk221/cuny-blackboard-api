import fetch from 'cross-fetch';
import { URL_BASE } from './authentication';
import { with_retries } from '../utilities';

type api_version = 'v1.private' | 'v1.public';

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
async function api_request(
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
        default:
            throw new Error(`Invalid API version: ${api}`);
    }

    // Wrap the request in a retry function
    const output = await with_retries(retries, delay, async () => {
        // Make the fetch request
        const response = await fetch(`${URL_BASE}${path}`, options);

        // Determine if the response returned a 401 Unauthorized
        if (response.status === 401) return new Error('BLACKBOARD_API_UNAUTHORIZED');

        // Determine if the response returned a 404 Not Found
        if (response.status === 404) return new Error('BLACKBOARD_API_NOT_FOUND');

        // Return the response to the caller
        return response;
    });

    // If the output is an error, throw it
    if (output instanceof Error) throw output;

    // Otherwise, return the output
    return output;
}

type User = {
    id: string;
    email: string;
    full_name: string;
    username: string;
};

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

type Course = {
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
};

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
