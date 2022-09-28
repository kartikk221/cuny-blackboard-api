import { Server } from 'hyper-express';

// Create a new server instance with SSL parameters from environment variables
const server = new Server({
    key_file_name: process.env['WEBSERVER_SSL_KEY_FILE_PATH'],
    cert_file_name: process.env['WEBSERVER_SSL_CERT_FILE_PATH'],
    passphrase: process.env['WEBSERVER_SSL_PASSPHRASE'],
});

// Bind a not found handler
server.set_not_found_handler((_, response) =>
    response.status(404).json({
        code: 'NOT_FOUND',
        message: 'The requested resource was not found on this server.',
    })
);

// Bind an error handler
server.set_error_handler((_, response, error) => {
    // Log the error to the console
    console.error(error);

    // Send an error response
    response.status(500).json({
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred on the server.',
    });
});

// Export the server instance
export default server;
