import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../services/CloudinaryService.js';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req: any, file: Express.Multer.File) => {
        const isPdf = file.mimetype === 'application/pdf';
        return {
            folder: 'saas_cloud',
            // PDFs MUST be uploaded as 'raw' to bypass Cloudinary's PDF external-sharing restriction.
            // All other types use 'auto' detection (image/video).
            resource_type: isPdf ? 'raw' : 'auto',
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'mp4', 'mov', 'webm', 'mp3', 'wav', 'ogg'],
        };
    },
} as any);

const upload = multer({ storage: storage });

export default upload;
