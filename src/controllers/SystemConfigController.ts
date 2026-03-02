import { Request, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getConfig = asyncHandler(async (req: Request, res: Response) => {
    let config = await prisma.systemConfig.findUnique({ where: { id: 'system' } });
    if (!config) {
        config = await prisma.systemConfig.create({
            data: { id: 'system', maintenanceMode: false, maxUploadSizeMB: 100 }
        });
    }

    return res.status(200).json(
        new ApiResponse(200, config, 'System configuration fetched successfully')
    );
});

export const updateConfig = asyncHandler(async (req: Request, res: Response) => {
    const { maintenanceMode, maxUploadSizeMB } = req.body;
    const config = await prisma.systemConfig.upsert({
        where: { id: 'system' },
        update: { maintenanceMode, maxUploadSizeMB },
        create: { id: 'system', maintenanceMode, maxUploadSizeMB }
    });

    return res.status(200).json(
        new ApiResponse(200, config, 'System configuration updated successfully')
    );
});
