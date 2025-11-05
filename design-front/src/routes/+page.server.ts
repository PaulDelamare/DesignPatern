import type { PageServerLoad } from './$types';
import type { ApiSuccess, UserSummary } from '$lib/types/auth';

const DEFAULT_ERROR = "Impossible de récupérer la liste des utilisateurs pour le moment.";

export const load: PageServerLoad = async (event) => {
	const { locals } = event;
	const base = {
		auth: locals.auth,
		users: null as UserSummary[] | null,
		usersError: null as string | null
	};

	if (!locals.auth) {
		return base;
	}

	if (locals.auth.user.role !== 'ADMIN') {
		return {
			...base,
			usersError: "Votre rôle actuel ne permet pas de consulter la liste des utilisateurs."
		};
	}

	try {
		const response = await locals.api('/api/users');

		if (!response.ok) {
			if (response.status === 401 || response.status === 403) {
				return {
					...base,
					usersError: "Votre session n'autorise pas l'accès à la liste des utilisateurs."
				};
			}

			let message = DEFAULT_ERROR;
			try {
				const body = (await response.json()) as { message?: string };
				if (body?.message) {
					message = body.message;
				}
			} catch (parseError) {
				console.error('Erreur lors de la lecture de la réponse /api/users', parseError);
			}

			return {
				...base,
				usersError: message
			};
		}

		const payload = (await response.json()) as ApiSuccess<UserSummary[]>;
		return {
			...base,
			users: payload.data ?? []
		};
	} catch (error) {
		console.error('Erreur lors de la récupération des utilisateurs', error);
		return {
			...base,
			usersError: DEFAULT_ERROR
		};
	}
};
