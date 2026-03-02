import { Request, Response } from 'express';
import { prisma } from '../index.js';
import { LimitService } from '../services/LimitService.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getUsageStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    // Get current subscription
    const sub = await LimitService.getActivePackage(userId);
    if (!sub) {
        throw new ApiError(404, 'No active subscription found');
    }

    // Calculate usage
    const fileCount = await prisma.file.count({ where: { userId } });
    const folderCount = await prisma.folder.count({ where: { userId } });
    const totalSizeRes = await prisma.file.aggregate({
        where: { userId },
        _sum: { size: true }
    });

    const totalSizeMB = (totalSizeRes._sum.size || 0) / (1024 * 1024);

    return res.status(200).json(
        new ApiResponse(200, {
            subscription: sub,
            package: sub.package,
            usage: {
                files: fileCount,
                folders: folderCount,
                storageMB: Number(totalSizeMB.toFixed(2)),
                storagePercent: Math.min(100, (totalSizeMB / (sub.package as any).totalStorageMB) * 100)
            }
        }, "Usage stats fetched successfully")
    );
});
