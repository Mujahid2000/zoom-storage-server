import { Request, Response } from 'express';
import { prisma } from '../index.js';
import { LimitService } from '../services/LimitService.js';

export const createFolder = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { name, parentId } = req.body;

        const limitCheck = await LimitService.canCreateFolder(userId, parentId);
        if (!limitCheck.allowed) return res.status(403).json({ error: limitCheck.error });

        const folder = await prisma.folder.create({
            data: {
                name,
                userId,
                parentId,
                nestingLevel: limitCheck.nestingLevel!,
            },
        });

        res.status(201).json(folder);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create folder' });
    }
};

export const getFolders = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { parentId } = req.query;

        const folders = await prisma.folder.findMany({
            where: {
                userId,
                parentId: parentId ? (parentId as string) : null
            },
            include: { _count: { select: { subFolders: true, files: true } } }
        });

        res.json(folders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch folders' });
    }
};

export const renameFolder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const folder = await prisma.folder.update({
            where: { id: id as string, userId: req.user!.userId },
            data: { name },
        });
        res.json(folder);
    } catch (err) {
        res.status(400).json({ error: 'Failed to rename folder' });
    }
};

export const deleteFolder = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.folder.delete({ where: { id: id as string, userId: req.user!.userId } });
        res.json({ message: 'Folder deleted' });
    } catch (err) {
        res.status(400).json({ error: 'Failed to delete folder' });
    }
};

export const getFolderPath = async (req: Request, res: Response) => {
    try {
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

        res.json(path);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch folder path' });
    }
};
