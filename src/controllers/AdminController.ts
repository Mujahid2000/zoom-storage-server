import { Request, Response } from 'express';
import { prisma } from '../index.js';

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                subscriptions: {
                    where: { endDate: null },
                    include: { package: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const getAllSubscriptions = async (req: Request, res: Response) => {
    try {
        const subscriptions = await prisma.subscription.findMany({
            include: {
                user: { select: { email: true } },
                package: true
            },
            orderBy: { startDate: 'desc' }
        });
        res.json(subscriptions);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
};

export const verifyUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.user.update({
            where: { id },
            data: { isVerified: true, verificationToken: null }
        });
        res.json({ message: 'User verified' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to verify user' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        // Cascade delete will handle folders/files/subscriptions
        await prisma.user.delete({ where: { id } });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
