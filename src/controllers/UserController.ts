import { Request, Response } from 'express';
import { prisma } from '../index.js';
import { LimitService } from '../services/LimitService.js';

export const getUsageStats = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;

        // Get current package
        const pkg = await LimitService.getActivePackage(userId);
        if (!pkg) {
            return res.status(404).json({ error: 'No active subscription found' });
        }

        // Calculate usage
        const fileCount = await prisma.file.count({ where: { userId } });
        const folderCount = await prisma.folder.count({ where: { userId } });
        const totalSizeRes = await prisma.file.aggregate({
            where: { userId },
            _sum: { size: true }
        });

        const totalSizeMB = (totalSizeRes._sum.size || 0) / (1024 * 1024);

        res.json({
            package: pkg,
            usage: {
                files: fileCount,
                folders: folderCount,
                storageMB: Number(totalSizeMB.toFixed(2)),
                storagePercent: Math.min(100, (totalSizeMB / (pkg as any).totalStorageMB) * 100)
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch usage stats' });
    }
};
