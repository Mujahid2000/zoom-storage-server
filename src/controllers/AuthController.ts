import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../index.js';
import { Role } from '@prisma/client';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'Email already exists' });

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
            await prisma.subscription.create({
                data: {
                    userId: user.id,
                    packageId: freePackage.id,
                },
            });
        }

        // SEND ACTUAL VERIFICATION EMAIL
        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({
            message: 'User created successfully. Please verify your email.',
            user: { id: user.id, email: user.email },
            verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Token is required' });

        const user = await prisma.user.findFirst({
            where: { verificationToken: token },
        });

        if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

        await prisma.user.update({
            where: { id: user.id },
            data: {
                isVerified: true,
                verificationToken: null,
            },
        });

        res.json({ message: 'Email verified successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Verification failed' });
    }
};

export const resendVerification = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.isVerified) return res.status(400).json({ error: 'Email is already verified' });

        const verificationToken = crypto.randomBytes(32).toString('hex');
        await prisma.user.update({
            where: { id: user.id },
            data: { verificationToken }
        });

        // SEND ACTUAL VERIFICATION EMAIL
        await sendVerificationEmail(email, verificationToken);

        res.json({
            message: 'Verification email sent successfully.',
            verificationToken: process.env.NODE_ENV === 'development' ? verificationToken : undefined
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to resend verification email' });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return res.status(404).json({ error: 'User not found' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: { resetToken, resetTokenExpiry },
        });

        // SEND ACTUAL PASSWORD RESET EMAIL
        await sendPasswordResetEmail(email, resetToken);

        res.json({ message: 'Password reset link sent to your email.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to process request' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() },
            },
        });

        if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        res.json({ message: 'Password reset successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reset password' });
    }
};

export const login = async (req: Request, res: Response) => {
    // ... existing login logic with verification check
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        if (!user.isVerified) return res.status(403).json({ error: 'Please verify your email first' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
