/**
 * Standard Success Response
 * @param {Object} res - Express response object
 * @param {Object} data - Data to send
 * @param {string} message - Message to send
 * @param {number} statusCode - HTTP status code
 */
const successResponse = (res, data = null, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

/**
 * Standard Error Response
 * Internal details of 5xx errors are logged server-side only; clients receive
 * a generic message so database/schema internals are never exposed.
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 */
const errorResponse = (res, message = 'Error', statusCode = 500) => {
    let clientMessage = message;
    if (statusCode >= 500) {
        if (message && message !== 'Internal Server Error') {
            console.error(`[ErrorResponse ${statusCode}]`, message);
        }
        clientMessage = 'Internal server error. Please try again later.';
    }
    return res.status(statusCode).json({
        success: false,
        message: clientMessage,
    });
};

module.exports = {
    successResponse,
    errorResponse,
};
