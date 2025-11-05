// ! IMPORTS
import argon2 from 'argon2';
import { logger } from '../logger/logger';

// ! CONFIGURATION
const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
    type: argon2.argon2id,
    timeCost: 3,
    memoryCost: 1 << 16, // 64 MiB
    parallelism: 1,
};

// ! HELPERS
export const hashPassword = async (password: string): Promise<string> => {
    return argon2.hash(password, ARGON2_OPTIONS);
};

export const verifyPassword = async (hash: string, candidate: string): Promise<boolean> => {
    try {
        return await argon2.verify(hash, candidate, ARGON2_OPTIONS);
    } catch (error) {
        logger.warn(`[Auth] Erreur lors de la vérification de mot de passe: ${(error as Error).message}`);
        return false;
    }
};
