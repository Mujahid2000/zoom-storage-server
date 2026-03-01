import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';

const transporter = nodemailer.createTransport({
    host: emailHost,
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT === '465',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // If using Gmail, 'service' helps bypass some host/port resolution issues natively in Nodemailer
    ...(emailHost.includes('gmail') && { service: 'gmail' }),
});

export const sendVerificationEmail = async (to: string, token: string) => {
    const verificationLink = `https://zoom-storage.vercel.app/verify?token=${token}`;

    const mailOptions = {
        from: `"ZoomIt Support" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Verify Your Email - ZoomIt',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
                <h2 style="color: #18181b; margin-bottom: 16px;">Welcome to ZoomIt!</h2>
                <p style="color: #71717a; line-height: 1.5;">Thank you for signing up. To complete your registration and start managing your files, please click the button below to verify your email address.</p>
                <div style="margin: 32px 0;">
                    <a href="${verificationLink}" style="background-color: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Verify Email Address</a>
                </div>
                <p style="color: #a1a1aa; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">${verificationLink}</p>
                <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
                <p style="color: #a1a1aa; font-size: 12px;">If you didn't create this account, you can safely ignore this email.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SENT] To: ${to}`);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
    const resetLink = `https://zoom-storage.vercel.app/reset-password?token=${token}`;

    const mailOptions = {
        from: `"ZoomIt Support" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Reset Your Password - ZoomIt',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px;">
                <h2 style="color: #18181b; margin-bottom: 16px;">Password Reset Request</h2>
                <p style="color: #71717a; line-height: 1.5;">You requested to reset your password. Click the button below to set a new one. This link is valid for 1 hour.</p>
                <div style="margin: 32px 0;">
                    <a href="${resetLink}" style="background-color: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
                </div>
                <p style="color: #a1a1aa; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">${resetLink}</p>
                <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
                <p style="color: #a1a1aa; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
            </div>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`[PASSWORD RESET EMAIL SENT] To: ${to}`);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};
