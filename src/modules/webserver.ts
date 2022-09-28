import { Server } from 'hyper-express';
import { not_found_handler, error_handler } from '../routes/handlers';

// Create a new server instance with SSL parameters from environment variables
const server = new Server({
    key_file_name: process.env['WEBSERVER_SSL_KEY_FILE_PATH'],
    cert_file_name: process.env['WEBSERVER_SSL_CERT_FILE_PATH'],
    passphrase: process.env['WEBSERVER_SSL_PASSPHRASE'],
});

// Bind a not found handler
server.set_not_found_handler(not_found_handler);

// Bind an error handler
server.set_error_handler(error_handler);

// Export the server instance
export default server;
