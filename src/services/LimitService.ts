import { prisma } from '../index.js';
import { FileType } from '@prisma/client';

export class LimitService {
    static async getActivePackage(userId: string) {
        const subscription = await prisma.subscription.findFirst({
            where: { userId, endDate: null },
            include: { package: true },
            orderBy: { startDate: 'desc' },
        });
        return subscription?.package;
    }

    static async canCreateFolder(userId: string, parentId: string | null) {
        const pkg = await this.getActivePackage(userId);
        if (!pkg) return { allowed: false, error: 'No active subscription' };

        // Max Folders
        const folderCount = await prisma.folder.count({ where: { userId } });
        if (folderCount >= pkg.maxFolders) return { allowed: false, error: 'Max folders reached' };

        // Max Nesting Level
        let nestingLevel = 0;
        if (parentId) {
            const parent = await prisma.folder.findUnique({ where: { id: parentId } });
            if (!parent) return { allowed: false, error: 'Parent folder not found' };
            nestingLevel = parent.nestingLevel + 1;
        }
        if (nestingLevel > pkg.maxNestingLevel) return { allowed: false, error: 'Max nesting level exceeded' };

        return { allowed: true, nestingLevel };
    }

    static async canUploadFile(userId: string, folderId: string | null, fileSizeMB: number, fileType: FileType) {
        const pkg = await this.getActivePackage(userId);
        if (!pkg) return { allowed: false, error: 'No active subscription' };

        // Allowed File Types
        if (!pkg.allowedFileTypes.includes(fileType)) return { allowed: false, error: 'File type not allowed' };

        // Max File Size
        if (fileSizeMB > pkg.maxFileSizeMB) return { allowed: false, error: 'File size too large' };

        // Total Storage Limit
        const totalSizeRes = await prisma.file.aggregate({
            where: { userId },
            _sum: { size: true }
        });
        const currentSizeMB = (Number(totalSizeRes._sum.size) || 0) / (1024 * 1024);
        if (currentSizeMB + fileSizeMB > pkg.totalStorageMB) {
            return { allowed: false, error: `Storage limit reached (${pkg.totalStorageMB} MB)` };
        }

        // Total File Limit
        const totalFiles = await prisma.file.count({ where: { userId } });
        if (totalFiles >= pkg.totalFileLimit) return { allowed: false, error: 'Total file limit reached' };

        // Files Per Folder
        const filesInFolder = await prisma.file.count({
            where: {
                folderId: folderId || null, // handle root files correctly
                userId
            }
        });
        if (filesInFolder >= pkg.filesPerFolder) return { allowed: false, error: 'Folder file limit reached' };

        return { allowed: true };
    }
}
