// ! IMPORTS
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { randomUUID } from 'crypto';
import { User } from '@prisma/client';
import { bdd } from '../../config/prismaClient.config';
import { logger } from '../Utils/logger/logger';
import { handleError } from '../Utils/errorHandler/errorHandler';
import { hashPassword as hashPasswordUtil, verifyPassword as verifyPasswordUtil } from '../Utils/hashPassword/hashPassword';
import { InMemorySessionStore, SessionStore } from './sessionStore';
import { TokenService, AuthTokenPayload } from './tokenService';
import { securityAuditLogger } from '../Utils/audit/securityAuditLogger';

// ! TYPES
export type SafeUser = Omit<User, 'password'>;

export interface AuthSession {
    id: string;
    user: SafeUser;
    createdAt: Date;
    lastActivity: Date;
    expiresAt: Date;
}

export interface AuthenticationContext {
    ip?: string;
    userAgent?: string;
}

export class AuthenticationEnforcer {
    private static instance: AuthenticationEnforcer;
    private readonly sessionStore: SessionStore;
    private readonly tokenService: TokenService;
    private readonly SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes
    private readonly MAX_LOGIN_ATTEMPTS = 5;
    private readonly LOGIN_ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
    private readonly LOGIN_BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
    private readonly loginAttempts = new Map<string, { count: number; firstAttempt: number; blockedUntil?: number }>();

    private constructor(store?: SessionStore, tokens?: TokenService) {
        this.sessionStore = store ?? new InMemorySessionStore();
        this.tokenService = tokens ?? TokenService.getInstance();
    }

    public static getInstance(): AuthenticationEnforcer {
        if (!AuthenticationEnforcer.instance) {
            AuthenticationEnforcer.instance = new AuthenticationEnforcer();
        }
        return AuthenticationEnforcer.instance;
    }

    // ! HELPERS
    private purgeExpiredSessions(): void {
        const now = Date.now();
        for (const [sessionId, session] of this.sessionStore.entries()) {
            if (session.expiresAt.getTime() <= now) {
                this.sessionStore.delete(sessionId);
                logger.info(`[Auth] Session expirée supprimée (${sessionId})`);
            }
        }
    }

    private createSession(user: SafeUser): AuthSession {
        const now = new Date();
        const newSession: AuthSession = {
            id: randomUUID(),
            user,
            createdAt: now,
            lastActivity: now,
            expiresAt: new Date(now.getTime() + this.SESSION_DURATION_MS),
        };

    this.sessionStore.set(newSession);
        return newSession;
    }

    private refreshSession(session: AuthSession): void {
        const now = new Date();
        session.lastActivity = now;
        session.expiresAt = new Date(now.getTime() + this.SESSION_DURATION_MS);
    }

    private getAttemptKey(email: string, context: AuthenticationContext): string {
        const ipPart = context.ip ?? 'unknown-ip';
        return `${email}:${ipPart}`;
    }

    private ensureNotBlocked(email: string, context: AuthenticationContext, attemptKey: string): void {
        const entry = this.loginAttempts.get(attemptKey);
        if (entry?.blockedUntil && entry.blockedUntil > Date.now()) {
            const remainingMs = entry.blockedUntil - Date.now();
            const remainingSeconds = Math.ceil(remainingMs / 1000);
            logger.warn(`[Auth] Tentative bloquée (trop d'échecs) pour ${email} ${context.ip ? `(IP: ${context.ip})` : ''}`);
            securityAuditLogger.logLoginAttempt(email, context.ip, false, { reason: 'BLOCKED', remainingSeconds });
            securityAuditLogger.logAnomaly('BRUTE_FORCE_BLOCK', email, context.ip, 'WARN', { blockedUntil: new Date(entry.blockedUntil).toISOString() });
            throw {
                status: 429,
                error: [{ field: 'credentials', message: `Trop de tentatives, réessayez dans ${remainingSeconds} secondes.` }]
            };
        }
    }

    private registerFailedAttempt(email: string, context: AuthenticationContext, attemptKey: string): boolean {
        const now = Date.now();
        const entry = this.loginAttempts.get(attemptKey);
        if (!entry || now - entry.firstAttempt > this.LOGIN_ATTEMPT_WINDOW_MS) {
            this.loginAttempts.set(attemptKey, { count: 1, firstAttempt: now });
            return false;
        }

        entry.count += 1;

        if (entry.count >= this.MAX_LOGIN_ATTEMPTS) {
            entry.blockedUntil = now + this.LOGIN_BLOCK_DURATION_MS;
            logger.warn(`[Auth] Blocage de ${email} après ${entry.count} tentatives infructueuses ${context.ip ? `(IP: ${context.ip})` : ''}`);
            securityAuditLogger.logAnomaly('BRUTE_FORCE_THRESHOLD', email, context.ip, 'WARN', {
                attempts: entry.count,
                windowMs: this.LOGIN_ATTEMPT_WINDOW_MS
            });
            return true;
        }

        return false;
    }

    private resetLoginAttempts(attemptKey: string): void {
        if (this.loginAttempts.has(attemptKey)) {
            this.loginAttempts.delete(attemptKey);
        }
    }

    private invalidCredentials(email: string, context: AuthenticationContext, reason: string, attemptKey: string): never {
        const isBlocked = this.registerFailedAttempt(email, context, attemptKey);
        securityAuditLogger.logLoginAttempt(email, context.ip, false, { reason });
        logger.warn(`[Auth] ${reason} (${email}) ${context.ip ? `(IP: ${context.ip})` : ''}`);
        if (isBlocked) {
            throw {
                status: 429,
                error: [{ field: 'credentials', message: 'Trop de tentatives, réessayez plus tard.' }]
            };
        }
        throw { status: 401, error: [{ field: 'credentials', message: 'Identifiants invalides' }] };
    }

    private extractSessionToken(req: Request): { sessionId: string; token: string | null; payload?: AuthTokenPayload } | null {
        const authHeader = req.headers['authorization'];
        if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            const token = authHeader.slice(7).trim();
            if (token.length > 0) {
                const payload = this.tokenService.verifyAccessToken(token);
                if (payload?.sessionId) {
                    return { sessionId: payload.sessionId, token, payload };
                }
            }
        }

        const sessionHeader = req.headers['x-session-id'];
        if (typeof sessionHeader === 'string' && sessionHeader.trim().length > 0) {
            return { sessionId: sessionHeader.trim(), token: null };
        }

        const potentialCookies = (req as Request & { cookies?: Record<string, string> }).cookies;
        if (potentialCookies?.sessionId) {
            return { sessionId: potentialCookies.sessionId, token: null };
        }

        return null;
    }

    // ! PASSWORD HELPERS
    public async hashPassword(password: string): Promise<string> {
        return hashPasswordUtil(password);
    }

    public async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
        return verifyPasswordUtil(passwordHash, password);
    }

    // ! SESSION MANAGEMENT
    public async login(email: string, password: string, context: AuthenticationContext = {}): Promise<{ sessionId: string; user: SafeUser; expiresAt: Date; }>
    {
        this.purgeExpiredSessions();

        const normalizedEmail = email.trim().toLowerCase();
        const attemptKey = this.getAttemptKey(normalizedEmail, context);
        this.ensureNotBlocked(normalizedEmail, context, attemptKey);
    logger.info(`[Auth] Tentative de connexion pour ${normalizedEmail} ${context.ip ? `(IP: ${context.ip})` : ''}`);

        const userRecord = await bdd.user.findUnique({ where: { email: normalizedEmail } });

        if (!userRecord) {
            this.invalidCredentials(normalizedEmail, context, 'Échec connexion - utilisateur inconnu', attemptKey);
        }

        const isPasswordValid = await this.verifyPassword(password, userRecord.password);
        if (!isPasswordValid) {
            this.invalidCredentials(normalizedEmail, context, 'Échec connexion - mot de passe invalide', attemptKey);
        }

        const { password: _, ...safeUser } = userRecord;
        const session = this.createSession(safeUser);
        this.resetLoginAttempts(attemptKey);
        securityAuditLogger.logLoginAttempt(safeUser.email, context.ip, true, { sessionId: session.id });

        logger.info(`[Auth] Connexion réussie pour ${safeUser.email} (session: ${session.id})`);

    return { sessionId: session.id, user: safeUser, expiresAt: session.expiresAt };
    }

    public logout(sessionId: string): void {
        if (this.sessionStore.get(sessionId)) {
            this.sessionStore.delete(sessionId);
            logger.info(`[Auth] Session supprimée (${sessionId})`);
            return;
        }
        logger.warn(`[Auth] Tentative de déconnexion d'une session inconnue (${sessionId})`);
    }

    public getSession(sessionId: string): AuthSession | undefined {
        this.purgeExpiredSessions();
        const session = this.sessionStore.get(sessionId);
        if (session && session.expiresAt.getTime() > Date.now()) {
            return session;
        }
        if (session) {
            this.sessionStore.delete(sessionId);
        }
        return undefined;
    }

    public checkAuthentication(): RequestHandler {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                this.purgeExpiredSessions();
                const tokenResult = this.extractSessionToken(req);

                if (!tokenResult) {
                    logger.warn('[Auth] Accès refusé - aucune session transmise');
                    securityAuditLogger.logUnauthorizedAccess(res.locals.authenticatedUser?.email, req.ip, req.originalUrl, 'Session absente');
                    return handleError({ status: 401, error: [{ field: 'authorization', message: 'Session absente.' }] }, req, res, 'AuthenticationEnforcer.checkAuthentication');
                }

                const session = this.sessionStore.get(tokenResult.sessionId);
                if (!session) {
                    logger.warn(`[Auth] Accès refusé - session inconnue (${tokenResult.sessionId})`);
                    securityAuditLogger.logUnauthorizedAccess(res.locals.authenticatedUser?.email, req.ip, req.originalUrl, 'Session inconnue');
                    return handleError({ status: 401, error: [{ field: 'session', message: 'Session invalide.' }] }, req, res, 'AuthenticationEnforcer.checkAuthentication');
                }

                if (session.expiresAt.getTime() <= Date.now()) {
                    this.sessionStore.delete(tokenResult.sessionId);
                    logger.warn(`[Auth] Accès refusé - session expirée (${tokenResult.sessionId})`);
                    securityAuditLogger.logUnauthorizedAccess(session.user.email, req.ip, req.originalUrl, 'Session expirée');
                    return handleError({ status: 401, error: [{ field: 'session', message: 'Session expirée.' }] }, req, res, 'AuthenticationEnforcer.checkAuthentication');
                }

                const freshUser = await bdd.user.findUnique({ where: { id: session.user.id } });
                if (!freshUser) {
                    this.sessionStore.delete(tokenResult.sessionId);
                    logger.warn(`[Auth] Accès refusé - utilisateur introuvable pour la session (${tokenResult.sessionId})`);
                    securityAuditLogger.logUnauthorizedAccess(session.user.email, req.ip, req.originalUrl, 'Utilisateur introuvable pour la session');
                    return handleError({ status: 401, error: [{ field: 'session', message: 'Session invalide.' }] }, req, res, 'AuthenticationEnforcer.checkAuthentication');
                }

                const { password: _password, ...safeFreshUser } = freshUser;
                const shouldRefreshUser =
                    safeFreshUser.role !== session.user.role ||
                    safeFreshUser.email !== session.user.email ||
                    safeFreshUser.username !== session.user.username ||
                    safeFreshUser.updatedAt.getTime() !== session.user.updatedAt.getTime();

                if (shouldRefreshUser) {
                    session.user = safeFreshUser;
                    logger.info(`[Auth] Session ${tokenResult.sessionId} synchronisée avec les données utilisateur récentes`);
                }

                if (tokenResult.payload && tokenResult.payload.email !== session.user.email) {
                    logger.warn(`[Auth] Accès refusé - token/email mismatch (${tokenResult.sessionId})`);
                    securityAuditLogger.logUnauthorizedAccess(session.user.email, req.ip, req.originalUrl, 'Token/email mismatch');
                    return handleError({ status: 401, error: [{ field: 'token', message: 'Token invalide.' }] }, req, res, 'AuthenticationEnforcer.checkAuthentication');
                }

                this.refreshSession(session);
                this.sessionStore.set(session);
                res.locals.sessionId = tokenResult.sessionId;
                res.locals.authSession = session;
                res.locals.authenticatedUser = session.user;
                if (tokenResult.payload) {
                    res.locals.authTokenPayload = tokenResult.payload;
                }

                next();
            } catch (error) {
                handleError(error, req, res, 'AuthenticationEnforcer.checkAuthentication');
            }
        };
    }
}

// ! EXPORT INSTANCE
export const authenticationEnforcer = AuthenticationEnforcer.getInstance();
