import { Server } from 'hyper-express';

// Import login routes
import { login_handler_post } from './login/post';

/**
 * Binds API routes to the server instance.
 * @param webserver
 */
export async function register_routes(webserver: Server) {
    webserver.post('/login', login_handler_post);
}
