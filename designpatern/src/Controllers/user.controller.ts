// ! IMPORTS
import { RequestHandler } from 'express';
import vine from '@vinejs/vine';
import { bdd } from '../../config/prismaClient.config';
import { authService } from '../Services/auth.services';
import { handleError } from '../Utils/errorHandler/errorHandler';
import { sendSuccess } from '../Utils/returnSuccess/returnSuccess';
import { sanitizeDataWithHtml } from '../Utils/sanitizeStringData/sanitizeStringData';
import { validateData } from '../Utils/validateData/validateData';
import { ROLE_VALUES, RoleValue, DEFAULT_ROLE } from '../Utils/roles/roles';
import { detectInjectionAttempt } from '../Utils/injectionDetection/detectInjection';
import { securityAuditLogger } from '../Utils/audit/securityAuditLogger';

// ! SCHEMAS
const createUserSchema = vine.object({
    email: vine.string().trim().email(),
    username: vine.string().trim().minLength(3).maxLength(64),
    password: vine.string().minLength(8).maxLength(128),
    role: vine.enum(ROLE_VALUES).optional()
});

const userIdParamsSchema = vine.object({
    id: vine.string().uuid()
});

// ! CONTROLLERS
const getAllUsers: RequestHandler = async (req, res) => {
    try {
    const users = await bdd.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                createdAt: true,
                updatedAt: true
            }
        });

        sendSuccess(res, 200, 'Liste des utilisateurs', users);
    } catch (error) {
        handleError(error, req, res, 'UserController.getAllUsers');
    }
};

const createUser: RequestHandler = async (req, res) => {
    try {
        const injectionAttempt = detectInjectionAttempt(req.body);
        if (injectionAttempt) {
            securityAuditLogger.logAnomaly('INJECTION_ATTEMPT', res.locals.authenticatedUser?.email, req.ip, 'WARN', {
                field: injectionAttempt.field,
                pattern: injectionAttempt.pattern,
                type: injectionAttempt.type
            });

            return handleError({
                status: 400,
                error: [
                    {
                        field: injectionAttempt.field,
                        message: "Tentative d'injection détectée. L'événement a été consigné."
                    }
                ]
            }, req, res, 'UserController.createUser');
        }

        const payload = await validateData(createUserSchema, req.body);
        const user = await authService.register({
            email: payload.email,
            password: payload.password,
            username: payload.username,
            role: (payload.role ?? DEFAULT_ROLE) as RoleValue
        });

        sendSuccess(res, 201, 'Utilisateur créé avec succès', user);
    } catch (error) {
        handleError(error, req, res, 'UserController.createUser');
    }
};

const getUserById: RequestHandler = async (req, res) => {
    try {
    const params = await validateData(userIdParamsSchema, { id: req.params.id as string });

        const user = await bdd.user.findUnique({
            where: { id: params.id },
            select: {
                id: true,
                email: true,
                username: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return handleError({ status: 404, error: [{ field: 'id', message: 'Utilisateur non trouvé' }] }, req, res, 'UserController.getUserById');
        }

        sendSuccess(res, 200, 'Utilisateur récupéré', user);
    } catch (error) {
        handleError(error, req, res, 'UserController.getUserById');
    }
};

const dashboard: RequestHandler = async (req, res) => {
    try {
        const users = await bdd.user.findMany({
            select: {
                id: true,
                email: true,
                username: true,
                createdAt: true
            }
        });

        const sanitizedUsers = users.map((user) => sanitizeDataWithHtml({
            username: user.username,
            email: user.email,
            createdAt: user.createdAt.toLocaleString('fr-FR')
        }));

        const listItems = sanitizedUsers
            .map((user) => `<li>${user.username} - ${user.email} - ${user.createdAt}</li>`)
            .join('');

        const html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8" />
    <title>Dashboard Utilisateurs</title>
</head>
<body>
    <h1>Dashboard Utilisateurs</h1>
    <ul>${listItems}</ul>
</body>
</html>`;

        res.status(200).send(html);
    } catch (error) {
        handleError(error, req, res, 'UserController.dashboard');
    }
};

// ! EXPORT
export const UserController = {
    getAllUsers,
    createUser,
    getUserById,
    dashboard
};