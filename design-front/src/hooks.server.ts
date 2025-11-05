import { env } from '$env/dynamic/private';
import type { Handle } from '@sveltejs/kit';
import { clearSessionCookies, getCookieOptions, tokenMaxAgeSeconds } from '$lib/server/auth';
import type { ApiSuccess } from '$lib/types/auth';
import type { AuthSession, LoginResponse } from '$lib/types/auth';

const API_BASE_URL = env.API_BASE_URL?.replace(/\/$/, '') ?? '';
const API_KEY = env.API_KEY ?? '';

if (!API_BASE_URL) {
	console.warn('[auth] API_BASE_URL est manquant dans .env. Les appels backend échoueront.');
}

if (!API_KEY) {
	console.warn('[auth] API_KEY est manquant dans .env. Les appels protégés seront refusés.');
}

const buildApiUrl = (path: string) => {
	if (path.startsWith('http://') || path.startsWith('https://')) {
		return path;
	}

	const normalizedPath = path.startsWith('/') ? path : `/${path}`;
	return `${API_BASE_URL}${normalizedPath}`;
};

const shouldRefreshSession = (auth: AuthSession | null) => {
	if (!auth) return true;
	const expiresAt = new Date(auth.expiresAt).getTime();
	return expiresAt <= Date.now();
};

export const handle: Handle = async ({ event, resolve }) => {
	const secure = event.url.protocol === 'https:';
	const sessionId = event.cookies.get('session_id') ?? null;
	const accessToken = event.cookies.get('access_token') ?? null;
	const tokenExpiresIn = event.cookies.get('token_expires_in') as LoginResponse['tokenExpiresIn'] | null;
	const sessionExpiresAt = event.cookies.get('session_expires_at') ?? null;

	event.locals.auth = null;
	event.locals.tokens = null;

	const cookieOptions = getCookieOptions(secure);

	if (sessionId && accessToken && tokenExpiresIn) {
		event.locals.tokens = {
			sessionId,
			accessToken,
			tokenExpiresIn,
			sessionExpiresAt: sessionExpiresAt ?? null
		};
	}

	event.locals.api = async (path: string, init: RequestInit = {}) => {
		const url = buildApiUrl(path);
		const headers = new Headers(init.headers ?? {});
		if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
			headers.set('Content-Type', 'application/json');
		}
		if (API_KEY) {
			headers.set('x-api-key', API_KEY);
		}
		if (event.locals.tokens?.accessToken) {
			headers.set('Authorization', `Bearer ${event.locals.tokens.accessToken}`);
		}
		if (event.locals.tokens?.sessionId && !headers.has('x-session-id')) {
			headers.set('x-session-id', event.locals.tokens.sessionId);
		}

		return event.fetch(url, { ...init, headers });
	};

	const currentTokens = event.locals.tokens;
	if (currentTokens && shouldRefreshSession(event.locals.auth)) {
		try {
			const response = await event.locals.api('/api/auth/session');
			if (response.ok) {
				const payload = (await response.json()) as ApiSuccess<AuthSession>;
				const session = payload.data;
				event.locals.auth = session;
				event.locals.tokens = {
					...currentTokens,
					sessionExpiresAt: session.expiresAt
				};
				const maxAge = tokenMaxAgeSeconds[currentTokens.tokenExpiresIn];
				const sessionCookieAge = Math.max(
					Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000),
					0
				);
				if (sessionCookieAge > 0) {
					event.cookies.set('session_id', session.id, {
						...cookieOptions,
						maxAge: sessionCookieAge
					});
					event.cookies.set('session_expires_at', session.expiresAt, {
						...cookieOptions,
						maxAge: sessionCookieAge
					});
				}
				if (maxAge > 0) {
					event.cookies.set('access_token', currentTokens.accessToken, {
						...cookieOptions,
						maxAge
					});
					event.cookies.set('token_expires_in', currentTokens.tokenExpiresIn, {
						...cookieOptions,
						maxAge
					});
				}
			} else if (response.status === 401 || response.status === 403) {
				clearSessionCookies(event, cookieOptions);
				event.locals.tokens = null;
				event.locals.auth = null;
			}
		} catch (error) {
			console.error('Erreur lors de la récupération de la session API', error);
		}
	}

	return resolve(event);
};
