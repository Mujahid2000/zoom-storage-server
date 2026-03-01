import { Role } from '../../generated/prisma/index.js';

export interface JWTPayload {
    userId: string;
    email: string;
    role: Role;
}

declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}
