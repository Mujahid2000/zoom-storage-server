import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    // Check Authorization header or query parameter
    const authHeader = req.headers.authorization;
    const queryToken = req.query.token as string;
    const token = authHeader?.split(' ')[1] || queryToken;

    if (!token) {
        console.log(`[Auth] No token for ${req.path}`);
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        req.user = decoded;
        next();
    } catch (err) {
        console.error(`[Auth] JWT fail for ${req.path}:`, err instanceof Error ? err.message : err);
        res.status(401).json({ error: 'Invalid token' });
    }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden: Admins only' });
    next();
};

import { prisma } from '../index.js';

export const checkMaintenance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const config = await prisma.systemConfig.findUnique({ where: { id: 'system' } });
        if (config?.maintenanceMode && req.user?.role !== 'ADMIN') {
            return res.status(503).json({
                error: 'System is currently under maintenance. Please try again later.',
                maintenance: true
            });
        }
        next();
    } catch (err) {
        next(); // fallback to let request through if config check fails
    }
};
