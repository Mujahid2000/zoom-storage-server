import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

try {
    console.log('Generating Prisma Client...');
    execSync('npx prisma generate', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }
    });
    console.log('Successfully generated Prisma Client.');
} catch (error) {
    console.error('Failed to generate Prisma Client:', error);
    process.exit(1);
}
