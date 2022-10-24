import { Server } from 'hyper-express';

// Import middlewares
import { use_require_token } from '../middlewares/require_token';

// Import login routes
import { login_handler_post } from './login/post_login';
import { cookies_handler_get } from './login/cookies/get_cookies';
import { refresh_handler_post } from './login/refresh/post_refresh';

// Import raw routes
import { raw_handler_any } from './raw/post_raw';

// Import me routes
import { me_handler_get } from './me/get_me';

// Import courses routes
import { courses_handler_get } from './courses/get_courses';
import { assignments_handler_get } from './courses/assignments/get_assignments';
import { specific_assignment_handler_get } from './courses/assignments/get_specifc_assignment';

// Import announcements routes
import { announcements_handler_get } from './courses/announcements/announcements';

/**
 * Binds API routes to the provided server instance.
 * @param webserver
 */
export async function register_routes(webserver: Server) {
    // Bind a global OPTIONS handler to allow for CORS
    webserver.options('*', (_, response) => {
        response
            .header('Access-Control-Allow-Origin', '*')
            .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            .header('Access-Control-Allow-Headers', 'Authorization')
            .send();
    });

    // Bind login routes
    webserver.post('/login', login_handler_post);
    webserver.get('/login/cookies', use_require_token, cookies_handler_get);
    webserver.post('/login/refresh', use_require_token, refresh_handler_post);

    // Bind raw routes
    // Prefix with /learn/api to lock down the incoming requests to only the Blackboard Learn API
    webserver.any('/raw/learn/api/*', use_require_token, raw_handler_any);

    // Bind me routes
    webserver.get('/me', use_require_token, me_handler_get);

    // Bind courses routes
    webserver.get('/courses', use_require_token, courses_handler_get);
    // webserver.get('/courses/:course_id', use_require_token);
    webserver.get('/courses/:course_id/assignments', use_require_token, assignments_handler_get);
    webserver.get('/courses/:course_id/assignments/:assignment_id', use_require_token, specific_assignment_handler_get);
    webserver.get('/courses/:course_id/announcements', use_require_token, announcements_handler_get);
}
