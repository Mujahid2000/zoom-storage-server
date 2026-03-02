import { Router } from 'express';
import * as AuthController from '../controllers/AuthController.js';
import * as PackageController from '../controllers/PackageController.js';
import * as FolderController from '../controllers/FolderController.js';
import * as FileController from '../controllers/FileController.js';
import * as SubscriptionController from '../controllers/SubscriptionController.js';
import * as UserController from '../controllers/UserController.js';
import * as SystemConfigController from '../controllers/SystemConfigController.js';
import { authenticate, isAdmin, checkMaintenance } from '../middleware/AuthMiddleware.js';
import { checkSubscriptionStatus } from '../middleware/SubscriptionMiddleware.js';
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

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication APIs
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: mysecurepassword
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Email already in use
 *       500:
 *         description: Server error
 */
// Auth
router.post('/auth/register', AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: mysecurepassword
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/auth/login', AuthController.login);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify user email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 example: 123456abcdef
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid token
 *       500:
 *         description: Server error
 */
router.post('/auth/verify-email', AuthController.verifyEmail);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification email sent
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/auth/resend-verification', AuthController.resendVerification);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/auth/forgot-password', AuthController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid token
 *       500:
 *         description: Server error
 */
router.post('/auth/reset-password', AuthController.resetPassword);

/**
 * @swagger
 * tags:
 *   name: Packages
 *   description: Package management APIs
 */

/**
 * @swagger
 * /packages:
 *   get:
 *     summary: Get all available packages
 *     tags: [Packages]
 *     responses:
 *       200:
 *         description: List of all packages
 *       500:
 *         description: Server error
 */
// Packages
router.get('/packages/all', PackageController.getAllPackages);
router.get('/packages/public', PackageController.getPublicPackages);

/**
 * @swagger
 * /packages:
 *   post:
 *     summary: Create a new package (Admin only)
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - maxFolders
 *               - maxNestingLevel
 *               - allowedFileTypes
 *               - maxFileSizeMB
 *               - totalFileLimit
 *               - filesPerFolder
 *               - totalStorageMB
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               maxFolders:
 *                 type: integer
 *               maxNestingLevel:
 *                 type: integer
 *               allowedFileTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               maxFileSizeMB:
 *                 type: integer
 *               totalFileLimit:
 *                 type: integer
 *               filesPerFolder:
 *                 type: integer
 *               totalStorageMB:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Package created successfully
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/packages', authenticate, isAdmin, PackageController.createPackage);

/**
 * @swagger
 * /packages/{id}:
 *   put:
 *     summary: Update an existing package (Admin only)
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               maxFolders:
 *                 type: integer
 *               maxNestingLevel:
 *                 type: integer
 *               allowedFileTypes:
 *                 type: array
 *                 items:
 *                   type: string
 *               maxFileSizeMB:
 *                 type: integer
 *               totalFileLimit:
 *                 type: integer
 *               filesPerFolder:
 *                 type: integer
 *               totalStorageMB:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Package updated successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Package not found
 *       500:
 *         description: Server error
 */
router.put('/packages/:id', authenticate, isAdmin, PackageController.updatePackage);

/**
 * @swagger
 * /packages/{id}:
 *   delete:
 *     summary: Delete a package (Admin only)
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Package deleted successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Package not found
 *       500:
 *         description: Server error
 */
router.delete('/packages/:id', authenticate, isAdmin, PackageController.deletePackage);

/**
 * @swagger
 * tags:
 *   name: Folders
 *   description: Folder management APIs
 */

/**
 * @swagger
 * /folders:
 *   get:
 *     summary: Get all folders for the authenticated user
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parentId
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of folders
 *       500:
 *         description: Server error
 */
// Folders
router.get('/folders', authenticate, FolderController.getFolders);

/**
 * @swagger
 * /folders:
 *   post:
 *     summary: Create a new folder
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Folder created
 *       400:
 *         description: Name is required or limit reached
 *       500:
 *         description: Server error
 */
router.post('/folders', authenticate, checkSubscriptionStatus, FolderController.createFolder);

/**
 * @swagger
 * /folders/{id}:
 *   put:
 *     summary: Rename a folder
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Folder renamed
 *       404:
 *         description: Folder not found
 *       500:
 *         description: Server error
 */
router.put('/folders/:id', authenticate, checkSubscriptionStatus, FolderController.renameFolder);

/**
 * @swagger
 * /folders/{id}:
 *   delete:
 *     summary: Delete a folder
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Folder deleted
 *       404:
 *         description: Folder not found
 *       500:
 *         description: Server error
 */
router.delete('/folders/:id', authenticate, checkSubscriptionStatus, FolderController.deleteFolder);

/**
 * @swagger
 * /folders/{id}/path:
 *   get:
 *     summary: Get path to a specific folder
 *     tags: [Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Folder path array
 *       404:
 *         description: Folder not found
 *       500:
 *         description: Server error
 */
router.get('/folders/:id/path', authenticate, FolderController.getFolderPath);

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File management APIs
 */

/**
 * @swagger
 * /files:
 *   get:
 *     summary: Get user files
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: folderId
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of files
 *       500:
 *         description: Server error
 */
// Files
router.get('/files', authenticate, FileController.getFiles);

/**
 * @swagger
 * /files:
 *   post:
 *     summary: Upload a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               folderId:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       201:
 *         description: File uploaded
 *       400:
 *         description: No file uploaded or limits exceeded
 *       500:
 *         description: Server error
 */
router.post('/files', authenticate, checkSubscriptionStatus, upload.single('file'), FileController.uploadFile);

/**
 * @swagger
 * /files/{id}:
 *   put:
 *     summary: Rename file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: File renamed
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
router.put('/files/:id', authenticate, checkSubscriptionStatus, FileController.renameFile);

/**
 * @swagger
 * /files/{id}:
 *   delete:
 *     summary: Delete file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: File deleted
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
router.delete('/files/:id', authenticate, checkSubscriptionStatus, FileController.deleteFile);

/**
 * @swagger
 * /files/{id}/download:
 *   get:
 *     summary: Download file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: JWT token for secure download link
 *     responses:
 *       200:
 *         description: File stream
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
router.get('/files/:id/download', authenticate, FileController.downloadFile);

import * as AdminController from '../controllers/AdminController.js';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management APIs
 */

/**
 * @swagger
 * /user/usage:
 *   get:
 *     summary: Get storage usage stats for user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Storage usage stats
 *       500:
 *         description: Server error
 */
// Users
router.get('/user/usage', authenticate, UserController.getUsageStats);

// ... (existing routes)

/**
 * @swagger
 * tags:
 *   name: Subscriptions
 *   description: User subscription APIs
 */

/**
 * @swagger
 * /subscriptions/current:
 *   get:
 *     summary: Get current active subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription details
 *       404:
 *         description: Subscription not found
 *       500:
 *         description: Server error
 */

// Subscriptions
router.get('/subscriptions/current', authenticate, SubscriptionController.getCurrentSubscription);

/**
 * @swagger
 * /subscriptions/history:
 *   get:
 *     summary: Get subscription history
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription history array
 *       500:
 *         description: Server error
 */
router.get('/subscriptions/history', authenticate, SubscriptionController.getSubscriptionHistory);

/**
 * @swagger
 * /subscriptions:
 *   post:
 *     summary: Update or create subscription
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - packageId
 *             properties:
 *               packageId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription updated
 *       404:
 *         description: Package not found
 *       500:
 *         description: Server error
 */
router.post('/subscriptions', authenticate, SubscriptionController.updateSubscription);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management APIs
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

// Admin Extensions
router.get('/admin/users', authenticate, isAdmin, AdminController.getAllUsers);

/**
 * @swagger
 * /admin/users/{id}/verify:
 *   post:
 *     summary: Manually verify a user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User verified
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/admin/users/:id/verify', authenticate, isAdmin, AdminController.verifyUser);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/admin/users/:id', authenticate, isAdmin, AdminController.deleteUser);

/**
 * @swagger
 * /admin/subscriptions:
 *   get:
 *     summary: Get all subscriptions globally (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all subscriptions
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/admin/subscriptions', authenticate, isAdmin, AdminController.getAllSubscriptions);

/**
 * @swagger
 * tags:
 *   name: System Config
 *   description: System configuration APIs
 */

/**
 * @swagger
 * /admin/system-config:
 *   get:
 *     summary: Get system configuration (Admin only)
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System configurations
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

// System Config
router.get('/admin/system-config', authenticate, isAdmin, SystemConfigController.getConfig);

/**
 * @swagger
 * /admin/system-config:
 *   put:
 *     summary: Update system configuration (Admin only)
 *     tags: [System Config]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               maintenanceMode:
 *                 type: boolean
 *               maxUploadSizeMB:
 *                 type: integer
 *     responses:
 *       200:
 *         description: System configuration updated
 *       403:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/admin/system-config', authenticate, isAdmin, SystemConfigController.updateConfig);

export default router;
