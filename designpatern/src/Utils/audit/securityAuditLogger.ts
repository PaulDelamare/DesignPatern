import { logger } from '../logger/logger';

export type AuditSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
export type AuditEventType =
    | 'LOGIN_ATTEMPT'
    | 'PERMISSION_CHANGE'
    | 'UNAUTHORIZED_ACCESS'
    | 'ANOMALY';

interface BaseAuditPayload {
    timestamp: string;
    event_type: AuditEventType;
    user?: string;
    ip_address?: string;
    severity: AuditSeverity;
    details: Record<string, unknown>;
}

class SecurityAuditLogger {
    private static instance: SecurityAuditLogger;

    private constructor() {}

    public static getInstance(): SecurityAuditLogger {
        if (!SecurityAuditLogger.instance) {
            SecurityAuditLogger.instance = new SecurityAuditLogger();
        }
        return SecurityAuditLogger.instance;
    }

    private emit(payload: BaseAuditPayload): void {
        const serialized = JSON.stringify(payload);
        const severityToLevel: Record<AuditSeverity, string> = {
            INFO: 'info',
            WARN: 'warn',
            ERROR: 'error',
            CRITICAL: 'crit'
        };

        logger.log({ level: severityToLevel[payload.severity], message: serialized });
    }

    public logLoginAttempt(user: string | undefined, ip: string | undefined, success: boolean, extra: Record<string, unknown> = {}): void {
        this.emit({
            timestamp: new Date().toISOString(),
            event_type: 'LOGIN_ATTEMPT',
            user,
            ip_address: ip,
            severity: success ? 'INFO' : 'WARN',
            details: { success, ...extra }
        });
    }

    public logPermissionChange(actor: string, target: string, previousRole: string, newRole: string): void {
        this.emit({
            timestamp: new Date().toISOString(),
            event_type: 'PERMISSION_CHANGE',
            user: actor,
            severity: 'INFO',
            details: { target, previousRole, newRole }
        });
    }

    public logUnauthorizedAccess(user: string | undefined, ip: string | undefined, resource: string, reason: string): void {
        this.emit({
            timestamp: new Date().toISOString(),
            event_type: 'UNAUTHORIZED_ACCESS',
            user,
            ip_address: ip,
            severity: 'WARN',
            details: { resource, reason }
        });
    }

    public logAnomaly(kind: string, user: string | undefined, ip: string | undefined, severity: AuditSeverity, context: Record<string, unknown> = {}): void {
        this.emit({
            timestamp: new Date().toISOString(),
            event_type: 'ANOMALY',
            user,
            ip_address: ip,
            severity,
            details: { type: kind, ...context }
        });
    }
}

export const securityAuditLogger = SecurityAuditLogger.getInstance();
