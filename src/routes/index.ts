import { Router } from 'express';
import * as AuthController from '../controllers/AuthController.js';
import * as PackageController from '../controllers/PackageController.js';
import * as FolderController from '../controllers/FolderController.js';
import * as FileController from '../controllers/FileController.js';
import * as SubscriptionController from '../controllers/SubscriptionController.js';
import * as UserController from '../controllers/UserController.js';
import * as SystemConfigController from '../controllers/SystemConfigController.js';
import { authenticate, isAdmin, checkMaintenance } from '../middleware/AuthMiddleware.js';
import upload from '../middleware/UploadMiddleware.js';

const router = Router();

// Apply maintenance check to all non-admin routes
router.use(async (req, res, next) => {
    // Skip maintenance check for admin routes or auth routes that don't need it
    if (req.path.startsWith('/admin') || req.path.startsWith('/auth')) {
        return next();
    }
    await checkMaintenance(req, res, next);
});

// Auth
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/verify-email', AuthController.verifyEmail);
router.post('/auth/resend-verification', AuthController.resendVerification);
router.post('/auth/forgot-password', AuthController.forgotPassword);
router.post('/auth/reset-password', AuthController.resetPassword);

// Packages
router.get('/packages', PackageController.getAllPackages);
router.post('/packages', authenticate, isAdmin, PackageController.createPackage);
router.put('/packages/:id', authenticate, isAdmin, PackageController.updatePackage);
router.delete('/packages/:id', authenticate, isAdmin, PackageController.deletePackage);

// Folders
router.get('/folders', authenticate, FolderController.getFolders);
router.post('/folders', authenticate, FolderController.createFolder);
router.put('/folders/:id', authenticate, FolderController.renameFolder);
router.delete('/folders/:id', authenticate, FolderController.deleteFolder);
router.get('/folders/:id/path', authenticate, FolderController.getFolderPath);

// Files
router.get('/files', authenticate, FileController.getFiles);
router.post('/files', authenticate, upload.single('file'), FileController.uploadFile);
router.put('/files/:id', authenticate, FileController.renameFile);
router.delete('/files/:id', authenticate, FileController.deleteFile);
router.get('/files/:id/download', authenticate, FileController.downloadFile);

import * as AdminController from '../controllers/AdminController.js';

// Users
router.get('/user/usage', authenticate, UserController.getUsageStats);

// ... (existing routes)

// Subscriptions
router.get('/subscriptions/current', authenticate, SubscriptionController.getCurrentSubscription);
router.get('/subscriptions/history', authenticate, SubscriptionController.getSubscriptionHistory);
router.post('/subscriptions', authenticate, SubscriptionController.updateSubscription);

// Admin Extensions
router.get('/admin/users', authenticate, isAdmin, AdminController.getAllUsers);
router.post('/admin/users/:id/verify', authenticate, isAdmin, AdminController.verifyUser);
router.delete('/admin/users/:id', authenticate, isAdmin, AdminController.deleteUser);
router.get('/admin/subscriptions', authenticate, isAdmin, AdminController.getAllSubscriptions);

// System Config
router.get('/admin/system-config', authenticate, isAdmin, SystemConfigController.getConfig);
router.put('/admin/system-config', authenticate, isAdmin, SystemConfigController.updateConfig);

export default router;
