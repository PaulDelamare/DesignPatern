// ! IMPORTS
import { randomBytes } from 'crypto';

// ! HELPER
export const generateToken = (size: number = 32): string => {
    if (size <= 0) {
        throw new Error('Token size must be greater than zero');
    }
    return randomBytes(size).toString('hex');
};
