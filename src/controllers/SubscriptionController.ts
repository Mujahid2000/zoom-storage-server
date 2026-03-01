import { Request, Response } from 'express';
import { prisma } from '../index.js';

export const getCurrentSubscription = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const subscription = await prisma.subscription.findFirst({
            where: { userId, endDate: null },
            include: { package: true },
            orderBy: { startDate: 'desc' },
        });
        res.json(subscription);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch subscription' });
    }
};

export const updateSubscription = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { packageId } = req.body;

        // End current subscription
        await prisma.subscription.updateMany({
            where: { userId, endDate: null },
            data: { endDate: new Date() },
        });

        // Start new subscription
        const subscription = await prisma.subscription.create({
            data: {
                userId,
                packageId,
            },
            include: { package: true },
        });

        res.json(subscription);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update subscription' });
    }
};

export const getSubscriptionHistory = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const history = await prisma.subscription.findMany({
            where: { userId },
            include: { package: true },
            orderBy: { startDate: 'desc' },
        });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
};
