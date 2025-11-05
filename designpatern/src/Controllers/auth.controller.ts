// ! IMPORTS
import { RequestHandler } from 'express';
import { authenticationEnforcer } from '../Security/authenticationEnforcer';
import { handleError } from '../Utils/errorHandler/errorHandler';
import { sendSuccess } from '../Utils/returnSuccess/returnSuccess';
import { validateData } from '../Utils/validateData/validateData';
import { loginSchema } from '../Validators/auth/login.validator';
import { registerSchema } from '../Validators/auth/register.validator';
import { authService } from '../Services/auth.services';
import { detectInjectionAttempt } from '../Utils/injectionDetection/detectInjection';
import { securityAuditLogger } from '../Utils/audit/securityAuditLogger';

// ! CONTROLLERS
const login: RequestHandler = async (req, res) => {
    try {

        const injectionAttempt = detectInjectionAttempt(req.body);
        if (injectionAttempt) {
            securityAuditLogger.logAnomaly('INJECTION_ATTEMPT', req.body?.email as string | undefined, req.ip, 'WARN', {
                field: injectionAttempt.field,
                pattern: injectionAttempt.pattern,
                type: injectionAttempt.type
            });

            throw {
                status: 400,
                error: [
                    {
                        field: injectionAttempt.field,
                        message: "Tentative d'injection détectée. L'événement a été consigné."
                    }
                ]
            };
        }

        const credentials = await validateData(loginSchema, req.body);

    const result = await authService.login(credentials, {
            ip: req.ip,
            userAgent: req.headers['user-agent'] as string | undefined
        });

        sendSuccess(res, 200, 'Connexion réussie', result);
    } catch (error) {
        handleError(error, req, res, 'AuthController.login');
    }
};

const register: RequestHandler = async (req, res) => {
    try {
        const injectionAttempt = detectInjectionAttempt(req.body);
        if (injectionAttempt) {
            securityAuditLogger.logAnomaly('INJECTION_ATTEMPT', req.body?.email as string | undefined, req.ip, 'WARN', {
                field: injectionAttempt.field,
                pattern: injectionAttempt.pattern,
                type: injectionAttempt.type
            });

            throw {
                status: 400,
                error: [
                    {
                        field: injectionAttempt.field,
                        message: "Tentative d'injection détectée. L'événement a été consigné."
                    }
                ]
            };
        }

        const payload = await validateData(registerSchema, req.body);
        const user = await authService.register(payload);
        sendSuccess(res, 201, 'Inscription réussie', user);
    } catch (error) {
        handleError(error, req, res, 'AuthController.register');
    }
};

const logout: RequestHandler = async (req, res) => {
    try {
        const sessionId = res.locals.sessionId as string | undefined;
        if (sessionId) {
            authenticationEnforcer.logout(sessionId);
        }

        sendSuccess(res, 200, 'Déconnexion réussie');
    } catch (error) {
        handleError(error, req, res, 'AuthController.logout');
    }
};

const session: RequestHandler = async (req, res) => {
    try {
        const authSession = res.locals.authSession;
        if (!authSession) {
            return handleError({ status: 404, error: [{ field: 'session', message: 'Session introuvable' }] }, req, res, 'AuthController.session');
        }

        sendSuccess(res, 200, 'Session active', authSession);
    } catch (error) {
        handleError(error, req, res, 'AuthController.session');
    }
};

// ! EXPORT
export const AuthController = {
    register,
    login,
    logout,
    session
};
