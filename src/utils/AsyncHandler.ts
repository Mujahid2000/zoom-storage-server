import { Request, Response, NextFunction } from 'express';

/**
 * A wrapper for asynchronous Express middleware and route handlers.
 * It catches any errors and passes them to the next middleware (error handler).
 * 
 * @param execution The asynchronous function to execute.
 * @returns A standard Express middleware function.
 */
const asyncHandler = (execution: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        execution(req, res, next).catch(next);
    };
};

export { asyncHandler };
