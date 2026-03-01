import { Request, Response } from 'express';
import { prisma } from '../index.js';
import { LimitService } from '../services/LimitService.js';
import { FileType } from '../../generated/prisma/index.js';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

export const uploadFile = async (req: Request, res: Response) => {
    try {
        const userId = req.user!.userId;
        const fileData = req.file;

        if (!fileData) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { folderId } = req.body;

        let type: FileType = FileType.IMAGE;
        if (fileData.mimetype.startsWith('video/')) type = FileType.VIDEO;
        else if (fileData.mimetype.startsWith('audio/')) type = FileType.AUDIO;
        else if (fileData.mimetype === 'application/pdf') type = FileType.PDF;

        const size = fileData.size || 0;
        const url = fileData.path;
        const name = fileData.originalname;
        const fileSizeMB = size / (1024 * 1024);

        const config = await prisma.systemConfig.findUnique({ where: { id: 'system' } });
        if (config && fileSizeMB > config.maxUploadSizeMB) {
            return res.status(403).json({ error: `File exceeds global limit of ${config.maxUploadSizeMB} MB` });
        }

        const limitCheck = await LimitService.canUploadFile(userId, folderId || null, fileSizeMB, type as FileType);
        if (!limitCheck.allowed) return res.status(403).json({ error: limitCheck.error });

        const file = await prisma.file.create({
            data: {
                name,
                size,
                type,
                url,
                user: { connect: { id: userId } },
                ...(folderId ? { folder: { connect: { id: folderId } } } : {}),
            },
        });

        res.status(201).json(file);
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: 'Failed to upload file' });
    }
};

export const getFiles = async (req: Request, res: Response) => {
    try {
        const { folderId } = req.query;
        const files = await prisma.file.findMany({
            where: {
                userId: req.user!.userId,
                folderId: folderId as string
            },
        });
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch files' });
    }
};

export const deleteFile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.file.delete({ where: { id: id as string, userId: req.user!.userId } });
        res.json({ message: 'File deleted' });
    } catch (err) {
        res.status(400).json({ error: 'Failed to delete file' });
    }
};

export const renameFile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const file = await prisma.file.update({
            where: { id: id as string, userId: req.user!.userId },
            data: { name },
        });
        res.json(file);
    } catch (err) {
        res.status(400).json({ error: 'Failed to rename file' });
    }
};

export const downloadFile = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log(`[Download] File ID: ${id}`);

        const file = await prisma.file.findUnique({
            where: { id: id as string, userId: req.user!.userId },
        });

        if (!file || !file.url) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Always force HTTPS for Cloudinary URLs
        const fetchUrl = file.url.replace(/^http:\/\//, 'https://');
        console.log(`[Download] Streaming: ${file.name} (${file.type}) from ${fetchUrl}`);

        const response = await fetch(fetchUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SaasCloud/1.0)' }
        });

        if (!response.ok) {
            console.error(`[Download] Fetch failed: ${response.status} ${response.statusText}`);

            // PDFs uploaded before the fix are stored as 'image' type which Cloudinary restricts.
            // Redirect the browser directly so IT fetches the file (bypasses server-side restriction).
            if (file.type === 'PDF') {
                console.log(`[Download] PDF server-fetch blocked — redirecting browser directly`);
                return res.redirect(302, fetchUrl);
            }

            throw new Error(`Storage fetch failed: ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const contentLength = response.headers.get('content-length');
        console.log(`[Download] Content-Type: ${contentType}, Length: ${contentLength}`);

        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
        res.setHeader('Content-Type', contentType);
        if (contentLength) res.setHeader('Content-Length', contentLength);

        if (!response.body) {
            return res.status(500).json({ error: 'No content received from storage' });
        }

        const readable = Readable.fromWeb(response.body as any);
        res.on('close', () => { if (!res.writableEnded) readable.destroy(); });

        try {
            await pipeline(readable, res);
            console.log(`[Download] Done: ${file.name}`);
        } catch (pipeErr: any) {
            if (pipeErr?.code !== 'ERR_STREAM_PREMATURE_CLOSE') throw pipeErr;
            console.log(`[Download] Client disconnected: ${file.name}`);
        }
    } catch (err) {
        console.error("Download error:", err);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to download file' });
    }
};
