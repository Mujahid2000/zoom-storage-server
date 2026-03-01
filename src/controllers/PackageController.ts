import { Request, Response } from 'express';
import { prisma } from '../index.js';

export const getAllPackages = async (req: Request, res: Response) => {
    try {
        const packages = await prisma.package.findMany();
        res.json(packages);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch packages' });
    }
};

export const createPackage = async (req: Request, res: Response) => {
    try {
        const pkg = await prisma.package.create({ data: req.body });
        res.status(201).json(pkg);
    } catch (err) {
        res.status(400).json({ error: 'Failed to create package' });
    }
};

export const updatePackage = async (req: Request, res: Response) => {
    try {
        const id = req.params['id'] as string;
        const pkg = await prisma.package.update({
            where: { id },
            data: req.body,
        });
        res.json(pkg);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update package' });
    }
};

export const deletePackage = async (req: Request, res: Response) => {
    try {
        const id = req.params['id'] as string;
        await prisma.package.delete({ where: { id } });
        res.json({ message: 'Package deleted' });
    } catch (err) {
        res.status(400).json({ error: 'Failed to delete package' });
    }
};
