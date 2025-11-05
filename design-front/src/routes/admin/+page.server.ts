import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.auth) {
		const redirectTo = encodeURIComponent(`${url.pathname}${url.search}`);
		throw redirect(303, `/login?redirectTo=${redirectTo}`);
	}

	if (locals.auth.user.role !== 'ADMIN') {
		throw error(404, {
			message: 'Page introuvable.'
		});
	}

	return {
		auth: locals.auth,
		users: null,
		usersError: null
	};
};
