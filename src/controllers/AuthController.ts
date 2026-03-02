import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../index.js';
import { Role } from '@prisma/client';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        throw new ApiError(400, 'Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            role: Role.USER, // Default to USER
            verificationToken,
        },
    });

    // Automatically assign "Free" package to new users
    const freePackage = await prisma.package.findUnique({ where: { name: 'Free' } });
    if (freePackage) {
        // Set expiry date to 1 year from now
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);

        await prisma.subscription.create({
            data: {
                userId: user.id,
                packageId: freePackage.id,
                expiryDate: expiryDate,
            },
        });
    }

    // SEND ACTUAL VERIFICATION EMAIL
    await sendVerificationEmail(email, verificationToken);

    return res.status(201).json(
        new ApiResponse(201, {
            user: { id: user.id, email: user.email },
            verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
        }, 'User created successfully. Please verify your email.')
    );
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) {
        throw new ApiError(400, 'Token is required');
    }

    const user = await prisma.user.findFirst({
        where: { verificationToken: token },
    });

    if (!user) {
        throw new ApiError(400, 'Invalid or expired token');
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            verificationToken: null,
        },
    });

    return res.status(200).json(
        new ApiResponse(200, null, 'Email verified successfully!')
    );
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, 'Email is required');
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    if (user.isVerified) {
        throw new ApiError(400, 'Email is already verified');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
        where: { id: user.id },
        data: { verificationToken }
    });

    // SEND ACTUAL VERIFICATION EMAIL
    await sendVerificationEmail(email, verificationToken);

    return res.status(200).json(
        new ApiResponse(200, {
            verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
        }, 'Verification email sent successfully.')
    );
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
    });

    // SEND ACTUAL PASSWORD RESET EMAIL
    await sendPasswordResetEmail(email, resetToken);

    return res.status(200).json(
        new ApiResponse(200, null, 'Password reset link sent to your email.')
    );
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    const user = await prisma.user.findFirst({
        where: {
            resetToken: token,
            resetTokenExpiry: { gt: new Date() },
        },
    });

    if (!user) {
        throw new ApiError(400, 'Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
        },
    });

    return res.status(200).json(
        new ApiResponse(200, null, 'Password reset successfully!')
    );
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new ApiError(400, 'Invalid credentials');
    }

    if (!user.isVerified) {
        throw new ApiError(403, 'Please verify your email first');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new ApiError(400, 'Invalid credentials');
    }

    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

    return res.status(200).json(
        new ApiResponse(200, { token, user: { id: user.id, email: user.email, role: user.role } }, 'Login successful')
    );
});
