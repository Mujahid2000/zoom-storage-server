import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        console.log('Checking for existing packages...');
        const pkgCount = await prisma.package.count();

        if (pkgCount === 0) {
            console.log('No packages found. Seeding default packages...');
            await prisma.package.createMany({
                data: [
                    {
                        name: 'Free',
                        price: 0,
                        maxFolders: 5,
                        maxNestingLevel: 3,
                        maxFileSizeMB: 10,
                        totalFileLimit: 100,
                        filesPerFolder: 20,
                        totalStorageMB: 1024,
                        allowedFileTypes: ['IMAGE', 'PDF']
                    },
                    {
                        name: 'Silver',
                        price: 10,
                        maxFolders: 50,
                        maxNestingLevel: 5,
                        maxFileSizeMB: 100,
                        totalFileLimit: 1000,
                        filesPerFolder: 100,
                        totalStorageMB: 10240,
                        allowedFileTypes: ['IMAGE', 'VIDEO', 'PDF', 'AUDIO']
                    },
                    {
                        name: 'Gold',
                        price: 25,
                        maxFolders: 200,
                        maxNestingLevel: 10,
                        maxFileSizeMB: 500,
                        totalFileLimit: 5000,
                        filesPerFolder: 500,
                        totalStorageMB: 51200,
                        allowedFileTypes: ['IMAGE', 'VIDEO', 'PDF', 'AUDIO']
                    },
                    {
                        name: 'Diamond',
                        price: 50,
                        maxFolders: 1000,
                        maxNestingLevel: 20,
                        maxFileSizeMB: 2048,
                        totalFileLimit: 20000,
                        filesPerFolder: 1000,
                        totalStorageMB: 204800,
                        allowedFileTypes: ['IMAGE', 'VIDEO', 'PDF', 'AUDIO']
                    }
                ]
            });
            console.log('Seeding completed successfully.');
        } else {
            console.log(`Found ${pkgCount} packages. Skipping seed.`);
        }
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main().catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
});
