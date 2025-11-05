import { redirect, type RequestEvent } from '@sveltejs/kit';
import { clearSessionCookies, getCookieOptions } from '$lib/server/auth';

const logout = async (event: RequestEvent) => {
	if (event.locals.tokens) {
		try {
			await event.locals.api('/api/auth/logout', { method: 'POST' });
		} catch (error) {
			console.error('Erreur lors de l’appel /api/auth/logout', error);
		}
	}

	const cookieOptions = getCookieOptions(event.url.protocol === 'https:');
	clearSessionCookies(event, cookieOptions);
	event.locals.auth = null;
	event.locals.tokens = null;
};

export const POST = async (event: RequestEvent) => {
	await logout(event);
	throw redirect(303, '/login');
};

export const GET = async (event: RequestEvent) => {
	await logout(event);
	throw redirect(303, '/login');
};
