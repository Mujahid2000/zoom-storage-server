import { Request, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await prisma.user.findMany({
        include: {
            subscriptions: {
                where: { endDate: null },
                include: { package: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(
        new ApiResponse(200, users, 'Users fetched successfully')
    );
});

export const getAllSubscriptions = asyncHandler(async (req: Request, res: Response) => {
    const subscriptions = await prisma.subscription.findMany({
        include: {
            user: { select: { email: true } },
            package: true
        },
        orderBy: { startDate: 'desc' }
    });

    return res.status(200).json(
        new ApiResponse(200, subscriptions, 'Subscriptions fetched successfully')
    );
});

export const verifyUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await prisma.user.update({
        where: { id },
        data: { isVerified: true, verificationToken: null }
    });

    return res.status(200).json(
        new ApiResponse(200, null, 'User verified successfully')
    );
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    // Cascade delete will handle folders/files/subscriptions
    await prisma.user.delete({ where: { id } });

    return res.status(200).json(
        new ApiResponse(200, null, 'User deleted successfully')
    );
});
