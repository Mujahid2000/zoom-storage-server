import { Request, Response } from 'express';
import { prisma } from '../index.js';

export const getConfig = async (req: Request, res: Response) => {
    try {
        let config = await prisma.systemConfig.findUnique({ where: { id: 'system' } });
        if (!config) {
            config = await prisma.systemConfig.create({
                data: { id: 'system', maintenanceMode: false, maxUploadSizeMB: 100 }
            });
        }
        res.json(config);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch system config' });
    }
};

export const updateConfig = async (req: Request, res: Response) => {
    try {
        const { maintenanceMode, maxUploadSizeMB } = req.body;
        const config = await prisma.systemConfig.upsert({
            where: { id: 'system' },
            update: { maintenanceMode, maxUploadSizeMB },
            create: { id: 'system', maintenanceMode, maxUploadSizeMB }
        });
        res.json(config);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update system config' });
    }
};
