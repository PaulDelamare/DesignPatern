import type { RequestEvent } from '@sveltejs/kit';
import type { LoginResponse, TokenDuration } from '$lib/types/auth';

const COOKIE_PATH = '/';

export type SessionCookieOptions = {
	path: string;
	httpOnly?: boolean;
	sameSite?: 'lax' | 'strict' | 'none';
	secure?: boolean;
	maxAge?: number;
};

export const tokenMaxAgeSeconds: Record<TokenDuration, number> = {
	'30d': 60 * 60 * 24 * 30,
	'1d': 60 * 60 * 24,
	'12h': 60 * 60 * 12,
	'15m': 60 * 15
};

export const getCookieOptions = (secure: boolean): SessionCookieOptions => ({
	path: COOKIE_PATH,
	httpOnly: true,
	sameSite: 'lax',
	secure
});

export const setSessionCookies = (
	event: RequestEvent,
	data: LoginResponse,
	options: SessionCookieOptions,
	tokenMaxAge: number,
	sessionMaxAge: number
) => {
	if (sessionMaxAge > 0) {
		event.cookies.set('session_id', data.sessionId, { ...options, maxAge: sessionMaxAge });
		event.cookies.set('session_expires_at', data.sessionExpiresAt, {
			...options,
			maxAge: sessionMaxAge
		});
	}

	if (tokenMaxAge > 0) {
		event.cookies.set('access_token', data.accessToken, { ...options, maxAge: tokenMaxAge });
		event.cookies.set('token_expires_in', data.tokenExpiresIn, { ...options, maxAge: tokenMaxAge });
	}
};

export const clearSessionCookies = (
	event: RequestEvent,
	options: SessionCookieOptions = { path: COOKIE_PATH }
) => {
	event.cookies.delete('session_id', options);
	event.cookies.delete('access_token', options);
	event.cookies.delete('token_expires_in', options);
	event.cookies.delete('session_expires_at', options);
};

export const persistLogin = (event: RequestEvent, data: LoginResponse) => {
	const secure = event.url.protocol === 'https:';
	const cookieOptions = getCookieOptions(secure);
	const tokenMaxAge = tokenMaxAgeSeconds[data.tokenExpiresIn];
	const sessionMaxAge = Math.max(
		Math.floor((new Date(data.sessionExpiresAt).getTime() - Date.now()) / 1000),
		0
	);

	setSessionCookies(event, data, cookieOptions, tokenMaxAge, sessionMaxAge);

	event.locals.tokens = {
		sessionId: data.sessionId,
		accessToken: data.accessToken,
		tokenExpiresIn: data.tokenExpiresIn,
		sessionExpiresAt: data.sessionExpiresAt
	};

	return {
		cookieOptions,
		tokenMaxAge,
		sessionMaxAge
	};
};
