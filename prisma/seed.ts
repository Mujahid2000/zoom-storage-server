import { PrismaClient, FileType } from '@prisma/client';
import dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const packages = [
        {
            name: 'Free',
            price: 0,
            maxFolders: 10,
            maxNestingLevel: 3,
            maxFileSizeMB: 5,
            totalFileLimit: 50,
            totalStorageMB: 1024, // 1GB
            filesPerFolder: 20,
            allowedFileTypes: [FileType.IMAGE, FileType.VIDEO, FileType.PDF, FileType.AUDIO]
        },
        {
            name: 'Silver',
            price: 10,
            maxFolders: 50,
            maxNestingLevel: 5,
            maxFileSizeMB: 25,
            totalFileLimit: 250,
            totalStorageMB: 5120, // 5GB
            filesPerFolder: 50,
            allowedFileTypes: [FileType.IMAGE, FileType.VIDEO, FileType.PDF, FileType.AUDIO]
        },
        {
            name: 'Gold',
            price: 25,
            maxFolders: 200,
            maxNestingLevel: 10,
            maxFileSizeMB: 100,
            totalFileLimit: 1000,
            totalStorageMB: 20480, // 20GB
            filesPerFolder: 100,
            allowedFileTypes: [FileType.IMAGE, FileType.VIDEO, FileType.PDF, FileType.AUDIO]
        },
        {
            name: 'Diamond',
            price: 50,
            maxFolders: 1000,
            maxNestingLevel: 20,
            maxFileSizeMB: 500,
            totalFileLimit: 5000,
            totalStorageMB: 102400, // 100GB
            filesPerFolder: 500,
            allowedFileTypes: [FileType.IMAGE, FileType.VIDEO, FileType.PDF, FileType.AUDIO]
        }
    ];

    for (const pkg of packages) {
        await prisma.package.upsert({
            where: { name: pkg.name },
            update: pkg,
            create: pkg,
        });
        console.log(`Package ${pkg.name} seeded.`);
    }

    // Ensure default system config
    await prisma.systemConfig.upsert({
        where: { id: 'system' },
        update: {},
        create: { id: 'system', maintenanceMode: false, maxUploadSizeMB: 100 }
    });
    console.log('System Config seeded.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
