export const URL_BASE = 'https://bbhosted.cuny.edu';
export const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36';
export const SESSION_COOKIES = ['JSESSIONID', 'BbRouter'];
export const ERROR_CODES = {
    NOT_FOUND: 'BLACKBOARD_API_NOT_FOUND',
    UNAUTHORIZED: 'BLACKBOARD_API_UNAUTHORIZED',
    SERVER_ERROR: 'BLACKBOARD_API_SERVER_ERROR',
    NOT_ALLOWED: 'BLACKBOARD_API_NOT_ALLOWED',
    BAD_REQUEST: 'BLACKBOARD_API_BAD_REQUEST',
};

/**
 * Constructs a unique assignment ID from various Blackboard IDs related to assignments.
 *
 * @param content_id The Blackboard content ID
 * @param grade_id The Blackboard grade column ID
 * @returns A unique assignment ID
 */
export function construct_assignment_id(content_id: string, grade_id: string): string {
    return Buffer.from(`${content_id}:${grade_id}`).toString('base64url');
}

/**
 * De-constructs a unique assignment ID into various Blackboard IDs related to assignments.
 *
 * @param id The unique assignment ID
 * @returns A unique assignment ID
 */
export function deconstruct_assignment_id(id: string): {
    content_id: string;
    grade_id: string;
} {
    const [content_id, grade_id] = Buffer.from(id, 'base64url').toString().split(':');
    return { content_id, grade_id };
}
