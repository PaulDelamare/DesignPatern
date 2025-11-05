import { NextFunction, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { handleError } from '../Utils/errorHandler/errorHandler';
import { securityAuditLogger } from '../Utils/audit/securityAuditLogger';

export type Action = 'read' | 'write' | 'delete' | 'admin';
export type Resource = string;

type RolePermissions = Record<Action, boolean>;
type RoleMatrix = Record<Role, RolePermissions>;

const ROLE_MATRIX: RoleMatrix = {
    [Role.ADMIN]: { read: true, write: true, delete: true, admin: true },
    [Role.MANAGER]: { read: true, write: true, delete: false, admin: false },
    [Role.USER]: { read: true, write: false, delete: false, admin: false }
};

class AuthorizationEnforcer {
    private static instance: AuthorizationEnforcer;
    private readonly matrix: RoleMatrix;

    private constructor(matrix: RoleMatrix = ROLE_MATRIX) {
        this.matrix = matrix;
    }

    public static getInstance(): AuthorizationEnforcer {
        if (!AuthorizationEnforcer.instance) {
            AuthorizationEnforcer.instance = new AuthorizationEnforcer();
        }
        return AuthorizationEnforcer.instance;
    }

    public canAccess(role: Role, action: Action): boolean {
        const rolePermissions = this.matrix[role];
        if (!rolePermissions) {
            return false;
        }
        return Boolean(rolePermissions[action]);
    }

    public requirePermission(action: Action, resource: Resource) {
        return (req: Request, res: Response, next: NextFunction) => {
            const user = res.locals.authenticatedUser as { role?: Role; email?: string } | undefined;

            if (!user || !user.role) {
                securityAuditLogger.logUnauthorizedAccess(user?.email, req.ip, resource, `Permission ${action} requise - utilisateur absent`);
                return handleError({ status: 401, error: [{ field: 'authorization', message: 'Authentification requise.' }] }, req, res, 'AuthorizationEnforcer.requirePermission');
            }

            if (!this.canAccess(user.role, action)) {
                securityAuditLogger.logUnauthorizedAccess(user.email, req.ip, resource, `Permission ${action} insuffisante pour le rôle ${user.role}`);
                return handleError({ status: 403, error: [{ field: 'authorization', message: 'Accès interdit pour ce rôle.' }] }, req, res, 'AuthorizationEnforcer.requirePermission');
            }

            next();
        };
    }

    public requireSelfOrPermission(action: Action, resource: Resource, extractTargetId: (req: Request) => string | null | undefined) {
        return (req: Request, res: Response, next: NextFunction) => {
            const user = res.locals.authenticatedUser as { id?: string; role?: Role; email?: string } | undefined;

            if (!user || !user.role || !user.id) {
                securityAuditLogger.logUnauthorizedAccess(user?.email, req.ip, resource, `Permission ${action} requise - utilisateur absent`);
                return handleError({ status: 401, error: [{ field: 'authorization', message: 'Authentification requise.' }] }, req, res, 'AuthorizationEnforcer.requireSelfOrPermission');
            }

            const targetId = extractTargetId(req);
            if (targetId && targetId === user.id) {
                return next();
            }

            if (!this.canAccess(user.role, action)) {
                securityAuditLogger.logUnauthorizedAccess(user.email, req.ip, resource, `Permission ${action} insuffisante pour le rôle ${user.role} (cible: ${targetId ?? 'inconnue'})`);
                return handleError({ status: 403, error: [{ field: 'authorization', message: 'Accès interdit pour ce rôle.' }] }, req, res, 'AuthorizationEnforcer.requireSelfOrPermission');
            }

            next();
        };
    }
}

export const authorizationEnforcer = AuthorizationEnforcer.getInstance();
export const requirePermission = (action: Action, resource: Resource) => authorizationEnforcer.requirePermission(action, resource);
export const requireSelfOrPermission = (
	action: Action,
	resource: Resource,
	extractTargetId: (req: Request) => string | null | undefined
) => authorizationEnforcer.requireSelfOrPermission(action, resource, extractTargetId);
