import { Request, Response } from 'express';
import { prisma } from '../index.js';
import { LimitService } from '../services/LimitService.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const createFolder = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { name, parentId } = req.body;

    const limitCheck = await LimitService.canCreateFolder(userId, parentId);
    if (!limitCheck.allowed) {
        throw new ApiError(403, limitCheck.error || "Folder creation limit exceeded");
    }

    const folder = await prisma.folder.create({
        data: {
            name,
            userId,
            parentId,
            nestingLevel: limitCheck.nestingLevel!,
        },
    });

    return res.status(201).json(
        new ApiResponse(201, folder, 'Folder created successfully')
    );
});

export const getFolders = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { parentId } = req.query;

    const folders = await prisma.folder.findMany({
        where: {
            userId,
            parentId: parentId ? (parentId as string) : null
        },
        include: { _count: { select: { subFolders: true, files: true } } }
    });

    return res.status(200).json(
        new ApiResponse(200, folders, 'Folders fetched successfully')
    );
});

export const renameFolder = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    const folder = await prisma.folder.update({
        where: { id: id as string, userId: req.user!.userId },
        data: { name },
    });

    return res.status(200).json(
        new ApiResponse(200, folder, 'Folder renamed successfully')
    );
});

export const deleteFolder = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.folder.delete({ where: { id: id as string, userId: req.user!.userId } });

    return res.status(200).json(
        new ApiResponse(200, null, 'Folder deleted successfully')
    );
});

export const getFolderPath = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const path: any[] = [];
    let currentId: string | null = id as string;

    while (currentId) {
        const folder: any = await prisma.folder.findUnique({
            where: { id: currentId, userId: req.user!.userId },
            select: { id: true, name: true, parentId: true }
        });
        if (!folder) break;
        path.unshift(folder);
        currentId = folder.parentId;
    }

    return res.status(200).json(
        new ApiResponse(200, path, 'Folder path fetched successfully')
    );
});
