import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '../generated/prisma/index.js';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

dotenv.config();

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


app.use('/api', routes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'SaaS File System Backend is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export { prisma };
