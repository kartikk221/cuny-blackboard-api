import 'dotenv/config';
import webserver from './modules/webserver';
import { log } from './modules/utilities';
import { register_routes } from './routes';
import { register_middlewares } from './middlewares';

// Wrap the startup logic in an async function to allow for async/await
(async () => {
    // Register middlewares to the webserver
    register_middlewares(webserver);

    // Register routes to the webserver
    register_routes(webserver);

    // Start the webserver on environment port or 3000
    await webserver.listen(Number(process.env['WEBSERVER_PORT']) || 3000);
    log('WEBSERVER', `Successfully started webserver on port ${webserver.port}`);
})();
