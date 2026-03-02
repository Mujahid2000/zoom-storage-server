import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './utils/swagger.js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

import routes from './routes/index.js';

const app = express();
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 5001;

app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://zoom-storage.vercel.app'],
    credentials: true,
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'template', 'index.html'));
});

app.use('/api', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'SaaS File System Backend is running' });
});

// Global error handling middleware
import { ApiError } from './utils/ApiError.js';
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: err.success,
            message: err.message,
            errors: err.errors,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }

    return res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        errors: [],
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

export { prisma };
export default app;
