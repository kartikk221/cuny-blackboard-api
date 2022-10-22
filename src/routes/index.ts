import { Server } from 'hyper-express';

// Import middlewares
import { use_require_token } from '../middlewares/require_token';

// Import login routes
import { login_handler_post } from './login/post_login';

// Import me routes
import { me_handler_get } from './me/get_me';

// Import courses routes
import { courses_handler_get } from './courses/get_courses';
import { assignments_handler_get } from './courses/assignments/get_assignments';

// Import announcements routes
import { announcements_handler_get } from './courses/announcements/announcements';

/**
 * Binds API routes to the provided server instance.
 * @param webserver
 */
export async function register_routes(webserver: Server) {
    // Bind a global OPTIONS handler to allow for CORS
    webserver.options('*', (_, response) =>
        response
            .header('Access-Control-Allow-Origin', '*')
            .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            .header('Access-Control-Allow-Headers', 'Authorization')
            .send()
    );

    // Bind login routes
    webserver.post('/login', login_handler_post);

    // Bind me routes
    webserver.get('/me', use_require_token, me_handler_get);

    // Bind courses routes
    webserver.get('/courses', use_require_token, courses_handler_get);
    // webserver.get('/courses/:course_id', use_require_token);
    webserver.get('/courses/:course_id/assignments', use_require_token, assignments_handler_get);

    // Bind announcements routes under courses
    webserver.get('/courses/:course_id/announcements', use_require_token, announcements_handler_get);
}
