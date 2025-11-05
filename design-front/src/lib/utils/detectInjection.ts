export type InjectionVector = 'SQL' | 'XSS';

export interface InjectionDetectionResult {
	vector: InjectionVector;
	pattern: string;
}

const SQL_SIGNATURES: RegExp[] = [
	/(\b)(select|union|insert|update|delete|drop|alter|create|exec|execute)(\b)/i,
	/(['"`])\s*(or|and)\s*\1\s*\d+=\d+/i,
	/--|;--|;#/,
	/\b1\s*=\s*1\b/i
];

const XSS_SIGNATURES: RegExp[] = [
	/<script\b/i,
	/on[a-z]+\s*=/i,
	/javascript:/i,
	/<img\b[^>]*(src|onerror)/i
];

export const detectInjectionAttempt = (value: unknown): InjectionDetectionResult | null => {
	if (typeof value !== 'string' || value.trim().length === 0) {
		return null;
	}

	for (const regex of SQL_SIGNATURES) {
		if (regex.test(value)) {
			return { vector: 'SQL', pattern: regex.source };
		}
	}

	for (const regex of XSS_SIGNATURES) {
		if (regex.test(value)) {
			return { vector: 'XSS', pattern: regex.source };
		}
	}

	return null;
};
