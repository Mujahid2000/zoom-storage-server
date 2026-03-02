/**
 * Standard utility for sending API responses.
 * 
 * @param statusCode The HTTP status code of the response.
 * @param data The data to be sent in the response body.
 * @param message A success message (defaults to "Success").
 */
class ApiResponse {
    statusCode: number;
    data: any;
    message: string;
    success: boolean;

    constructor(statusCode: number, data: any, message: string = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}

export { ApiResponse };
