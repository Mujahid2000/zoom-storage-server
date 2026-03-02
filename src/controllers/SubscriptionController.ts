import { Request, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getCurrentSubscription = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const subscription = await prisma.subscription.findFirst({
        where: { userId, endDate: null },
        include: { package: true },
        orderBy: { startDate: 'desc' },
    });

    return res.status(200).json(
        new ApiResponse(200, subscription, 'Current subscription fetched successfully')
    );
});

export const updateSubscription = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { packageId } = req.body;

    // End current subscription
    await prisma.subscription.updateMany({
        where: { userId, endDate: null },
        data: { endDate: new Date() },
    });

    // Start new subscription
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days default

    const subscription = await prisma.subscription.create({
        data: {
            userId,
            packageId,
            expiryDate,
        },
        include: { package: true },
    });

    return res.status(200).json(
        new ApiResponse(200, subscription, 'Subscription updated successfully')
    );
});

export const getSubscriptionHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const history = await prisma.subscription.findMany({
        where: { userId },
        include: { package: true },
        orderBy: { startDate: 'desc' },
    });

    return res.status(200).json(
        new ApiResponse(200, history, 'Subscription history fetched successfully')
    );
});
