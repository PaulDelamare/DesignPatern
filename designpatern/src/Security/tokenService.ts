// ! IMPORTS
import jwt, { JwtPayload } from 'jsonwebtoken';
import { throwError } from '../Utils/errorHandler/errorHandler';
import { logger } from '../Utils/logger/logger';

// ! TYPES
export interface AuthTokenPayload extends JwtPayload {
    sessionId: string;
    email: string;
}

// ! SERVICE
export class TokenService {
    private static instance: TokenService;
    private readonly secret: string;

    private constructor() {
        const jwtSecret = process.env.JWT_SECRET ?? throwError(500, 'Jeton JWT non configuré');
        this.secret = jwtSecret;
    }

    public static getInstance(): TokenService {
        if (!TokenService.instance) {
            TokenService.instance = new TokenService();
        }
        return TokenService.instance;
    }

    generateAccessToken(payload: AuthTokenPayload, expiresIn: '30d' | '1d' | '15m' | '12h'): string {
        return jwt.sign(payload, this.secret, { expiresIn });
    }

    verifyAccessToken(token: string): AuthTokenPayload | null {
        try {
            return jwt.verify(token, this.secret) as AuthTokenPayload;
        } catch (error) {
            logger.warn(`[Auth] Échec de vérification du token : ${(error as Error).message}`);
            return null;
        }
    }
}
