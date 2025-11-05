// ! IMPORTS
import type { PasswordResetToken, User } from '@prisma/client';
import { bdd } from '../../config/prismaClient.config';
import { authenticationEnforcer, AuthenticationContext } from '../Security/authenticationEnforcer';
import { TokenService } from '../Security/tokenService';
import { generateToken } from '../Utils/generateToken/generateToken';
import { throwError } from '../Utils/errorHandler/errorHandler';
import { SafeUser } from './user.services';
import { DEFAULT_ROLE, RoleValue } from '../Utils/roles/roles';
import { securityAuditLogger } from '../Utils/audit/securityAuditLogger';

export interface RegisterUserInput {
    email: string;
    username: string;
    password: string;
    role?: RoleValue;
}

export interface AuthLoginResult {
    accessToken: string;
    sessionId: string;
    user: SafeUser;
    tokenExpiresIn: '30d' | '1d' | '15m' | '12h';
    sessionExpiresAt: Date;
}

// ! SERVICES
export class AuthService {
    private static instance: AuthService;

    private constructor(
        private readonly enforcer = authenticationEnforcer,
        private readonly tokenService = TokenService.getInstance()
    ) {}

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    public async register(validatedData: RegisterUserInput): Promise<SafeUser> {
        const hashedPassword = await this.enforcer.hashPassword(validatedData.password);
        const roleToAssign = validatedData.role ?? DEFAULT_ROLE;

        const createdUser = await bdd.user.create({
            data: {
                email: validatedData.email.toLowerCase(),
                username: validatedData.username,
                password: hashedPassword,
                role: roleToAssign
            },
        });

        if (roleToAssign !== DEFAULT_ROLE) {
            securityAuditLogger.logPermissionChange(validatedData.email.toLowerCase(), createdUser.id, DEFAULT_ROLE, roleToAssign);
        }

        const { password, ...safeUser } = createdUser;
        return safeUser;
    }

    public async login(
        validatedData: Pick<User, 'email' | 'password'> & { rememberMe?: boolean },
        context: AuthenticationContext
    ): Promise<AuthLoginResult> {
    const { sessionId, user, expiresAt } = await this.enforcer.login(validatedData.email, validatedData.password, context);

        const rememberDuration = validatedData.rememberMe ? '30d' : '1d';
        const accessToken = this.tokenService.generateAccessToken({ email: user.email, sessionId }, rememberDuration);

    return { accessToken, sessionId, user, tokenExpiresIn: rememberDuration, sessionExpiresAt: expiresAt };
    }

    public async generatePasswordReset(validatedData: Pick<User, 'email'>): Promise<{ token: string; user: SafeUser }> {
        const user = await bdd.user.findUnique({ where: { email: validatedData.email.toLowerCase() } });
        if (!user) {
            throwError(200, 'Un email a été envoyé');
        }

        const ensuredUser = user as User;

        const token = generateToken(32);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await bdd.$transaction([
            bdd.passwordResetToken.deleteMany({ where: { userId: ensuredUser.id } }),
            bdd.passwordResetToken.create({ data: { userId: ensuredUser.id, token, expiresAt } })
        ]);

        const { password, ...safeUser } = ensuredUser;
        return { token, user: safeUser };
    }

    public async ensureResetRequest(validatedData: Pick<PasswordResetToken, 'token' | 'userId'>): Promise<void> {
        const passwordResetToken = await bdd.passwordResetToken.findUnique({
            where: validatedData
        });

        if (!passwordResetToken) {
            throwError(404, 'Aucune demande de reinitialisation de mot de passe trouvée');
        }
    }

    public async changePassword(validatedData: Pick<PasswordResetToken, 'token' | 'userId'> & Pick<User, 'password'>): Promise<void> {
        const { token, userId, password } = validatedData;

        await this.ensureResetRequest({ token, userId });

        await bdd.user.update({
            where: { id: userId },
            data: { password: await this.enforcer.hashPassword(password) }
        });

        await bdd.passwordResetToken.delete({ where: { token } });
    }
}

export const authService = AuthService.getInstance();
