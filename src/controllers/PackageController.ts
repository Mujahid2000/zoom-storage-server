import { Request, Response } from 'express';
import { prisma } from '../index.js';
import { asyncHandler } from '../utils/AsyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getAllPackages = asyncHandler(async (req: Request, res: Response) => {
    const packages = await prisma.package.findMany({
        orderBy: { price: 'asc' }
    });

    return res.status(200).json(
        new ApiResponse(200, packages, 'Packages fetched successfully')
    );
});

export const getPublicPackages = asyncHandler(async (req: Request, res: Response) => {
    const packages = await prisma.package.findMany({
        orderBy: { price: 'asc' }
    });

    return res.status(200).json(
        new ApiResponse(200, packages, 'Public packages fetched successfully')
    );
});

export const createPackage = asyncHandler(async (req: Request, res: Response) => {
    const pkg = await prisma.package.create({ data: req.body });

    return res.status(201).json(
        new ApiResponse(201, pkg, 'Package created successfully')
    );
});

export const updatePackage = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params['id'] as string;
    const pkg = await prisma.package.update({
        where: { id },
        data: req.body,
    });

    return res.status(200).json(
        new ApiResponse(200, pkg, 'Package updated successfully')
    );
});

export const deletePackage = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params['id'] as string;
    await prisma.package.delete({ where: { id } });

    return res.status(200).json(
        new ApiResponse(200, null, 'Package deleted successfully')
    );
});
