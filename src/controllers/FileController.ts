import { Request, Response } from 'express';
import { prisma } from '../index.js';
import { LimitService } from '../services/LimitService.js';
import { FileType } from '@prisma/client';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const fileData = req.file;

    if (!fileData) {
        throw new ApiError(400, 'No file uploaded');
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
        throw new ApiError(403, `File exceeds global limit of ${config.maxUploadSizeMB} MB`);
    }

    const limitCheck = await LimitService.canUploadFile(userId, folderId || null, fileSizeMB, type as FileType);
    if (!limitCheck.allowed) {
        throw new ApiError(403, limitCheck.error || "Upload limit exceeded");
    }

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

    return res.status(201).json(
        new ApiResponse(201, file, 'File uploaded successfully')
    );
});

export const getFiles = asyncHandler(async (req: Request, res: Response) => {
    const { folderId } = req.query;
    const files = await prisma.file.findMany({
        where: {
            userId: req.user!.userId,
            folderId: folderId as string
        },
    });

    return res.status(200).json(
        new ApiResponse(200, files, 'Files fetched successfully')
    );
});

export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await prisma.file.delete({ where: { id: id as string, userId: req.user!.userId } });

    return res.status(200).json(
        new ApiResponse(200, null, 'File deleted successfully')
    );
});

export const renameFile = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    const file = await prisma.file.update({
        where: { id: id as string, userId: req.user!.userId },
        data: { name },
    });

    return res.status(200).json(
        new ApiResponse(200, file, 'File renamed successfully')
    );
});

export const downloadFile = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(`[Download] File ID: ${id}`);

    const file = await prisma.file.findUnique({
        where: { id: id as string, userId: req.user!.userId },
    });

    if (!file || !file.url) {
        throw new ApiError(404, 'File not found');
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

        throw new ApiError(response.status, `Storage fetch failed: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    console.log(`[Download] Content-Type: ${contentType}, Length: ${contentLength}`);

    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`);
    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);

    if (!response.body) {
        throw new ApiError(500, 'No content received from storage');
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
});
