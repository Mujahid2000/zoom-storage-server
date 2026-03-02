/**
 * Custom Error class for handling API-specific errors.
 * Includes HTTP status codes and consistent error messages.
 * 
 * @param statusCode The HTTP status code (e.g., 400, 401, 404, 500).
 * @param message The error message.
 * @param errors An array of specific error details (optional).
 * @param stack The error stack trace (optional).
 */
class ApiError extends Error {
    statusCode: number;
    data: any;
    success: boolean;
    errors: any[];

    constructor(
        statusCode: number,
        message: string = "Something went wrong",
        errors: any[] = [],
        stack: string = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };
