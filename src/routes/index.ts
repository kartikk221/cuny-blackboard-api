import { Server } from 'hyper-express';

// Import middlewares
import { use_require_token } from '../middlewares/require_token';

// Import login routes
import { login_handler_post } from './login/post';

// Import me routes
import { me_handler_get } from '../routes/me/get';

// Import courses routes
import { courses_handler_get } from './courses/get';

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
}
