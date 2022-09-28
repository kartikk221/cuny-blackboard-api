import { Server } from 'hyper-express';
import { login_handler_post } from './login/login';

/**
 * Binds API routes to the server instance.
 * @param webserver
 */
export async function register_routes(webserver: Server) {
    webserver.post('/login', login_handler_post);
}
