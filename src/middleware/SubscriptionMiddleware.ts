import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/AsyncHandler.js';

export const checkSubscriptionStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    if (!userId) {
        throw new ApiError(401, 'Unauthorized');
    }

    // Skip check for GET requests (viewing is always allowed)
    if (req.method === 'GET') {
        return next();
    }

    // Skip check for admins
    if (req.user?.role === 'ADMIN') {
        return next();
    }

    const currentSubscription = await prisma.subscription.findFirst({
        where: { userId, endDate: null },
        orderBy: { startDate: 'desc' },
    });

    if (!currentSubscription) {
        throw new ApiError(403, 'No active subscription found. Please subscribe to a plan.');
    }

    if (currentSubscription.expiryDate && new Date(currentSubscription.expiryDate) < new Date()) {
        throw new ApiError(403, 'Your subscription has expired. Please upgrade or renew your plan to perform this action.');
    }

    next();
});
