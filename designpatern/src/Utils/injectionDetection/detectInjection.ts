export type InjectionType = 'SQL' | 'XSS';

export interface InjectionAttempt {
    field: string;
    pattern: string;
    type: InjectionType;
}

const SQL_PATTERNS: RegExp[] = [
    /(\b)(select|union|insert|update|delete|drop|alter|create|truncate|exec|execute)(\b)/i,
    /(\b)(or|and)\b\s+\d+=\d+/i,
    /('--|;--|;#|\/\*)/, // comment based payloads
    /\b1=1\b/i,
    /\bwaitfor\b|\bsleep\s*\(/i
];

const XSS_PATTERNS: RegExp[] = [
    /<script\b/i,
    /on[a-z]+\s*=/i,
    /javascript:/i,
    /<img\b[^>]*src/i
];

const SUSPICIOUS_CHAR_SEQUENCES: RegExp[] = [
    /(['"`])\s*(or|and)\s*\1/i,
    /(['"`])\s*;/
];

const isString = (value: unknown): value is string => typeof value === 'string';

const evaluateValue = (value: string): { pattern: string; type: InjectionType } | null => {
    if (!value) return null;

    for (const regex of SQL_PATTERNS) {
        if (regex.test(value)) {
            return { pattern: regex.source, type: 'SQL' };
        }
    }

    for (const regex of XSS_PATTERNS) {
        if (regex.test(value)) {
            return { pattern: regex.source, type: 'XSS' };
        }
    }

    for (const regex of SUSPICIOUS_CHAR_SEQUENCES) {
        if (regex.test(value)) {
            return { pattern: regex.source, type: 'SQL' };
        }
    }

    return null;
};

export const detectInjectionAttempt = (payload: unknown, currentPath: string[] = []): InjectionAttempt | null => {
    if (payload == null) {
        return null;
    }

    if (isString(payload)) {
        const evaluation = evaluateValue(payload);
        if (evaluation) {
            return {
                field: currentPath.join('.') || 'payload',
                pattern: evaluation.pattern,
                type: evaluation.type
            };
        }
        return null;
    }

    if (Array.isArray(payload)) {
        for (let index = 0; index < payload.length; index += 1) {
            const attempt = detectInjectionAttempt(payload[index], [...currentPath, String(index)]);
            if (attempt) {
                return attempt;
            }
        }
        return null;
    }

    if (typeof payload === 'object') {
        for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
            const attempt = detectInjectionAttempt(value, [...currentPath, key]);
            if (attempt) {
                return attempt;
            }
        }
    }

    return null;
};
