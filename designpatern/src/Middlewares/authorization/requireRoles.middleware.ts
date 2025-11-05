// ! IMPORTS
import { NextFunction, Request, Response } from 'express';
import { handleError } from '../../Utils/errorHandler/errorHandler';
import { logger } from '../../Utils/logger/logger';
import { RoleValue } from '../../Utils/roles/roles';
import { securityAuditLogger } from '../../Utils/audit/securityAuditLogger';

// ! TYPES
export type AllowedRoles = RoleValue[];

// ! MIDDLEWARE
export const requireRoles = (...roles: AllowedRoles) => {
    const allowed = new Set<RoleValue>(roles);

    return (req: Request, res: Response, next: NextFunction) => {
        const user = res.locals.authenticatedUser as { role?: RoleValue; email?: string } | undefined;

        if (!user || !user.role) {
            logger.warn('[Auth] Accès refusé - utilisateur absent pour le contrôle des rôles');
            securityAuditLogger.logUnauthorizedAccess(user?.email, req.ip, req.originalUrl, 'Utilisateur absent pour le contrôle des rôles');
            return handleError({ status: 401, error: [{ field: 'authorization', message: 'Authentification requise.' }] }, req, res, 'requireRoles');
        }

        if (allowed.size === 0) {
            return next();
        }

        if (!allowed.has(user.role)) {
            logger.warn(`[Auth] Accès refusé - rôle insuffisant (${user.role}) pour ${req.method} ${req.originalUrl}`);
            securityAuditLogger.logUnauthorizedAccess(user.email, req.ip, req.originalUrl, `Rôle insuffisant (${user.role})`);
            return handleError({ status: 403, error: [{ field: 'authorization', message: 'Accès interdit pour ce rôle.' }] }, req, res, 'requireRoles');
        }

        next();
    };
};
