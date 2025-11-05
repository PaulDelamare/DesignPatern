import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { superValidate, setError, message } from 'sveltekit-superforms/server';
import { zod, type ZodValidation } from 'sveltekit-superforms/adapters';
import { loginSchema } from '$lib/schemas/auth';
import type { ApiFieldError, ApiSuccess, AuthSession, LoginResponse } from '$lib/types/auth';
import { persistLogin } from '$lib/server/auth';

const loginValidation = zod(loginSchema as unknown as ZodValidation);
type MessageOptions = NonNullable<Parameters<typeof message>[2]>;
type MessageStatus = MessageOptions extends { status?: infer S } ? S : never;

export const load = async (event: RequestEvent) => {
	const { locals } = event;
	if (locals.auth) {
		throw redirect(303, '/');
	}

	return {
		form: await superValidate(event, loginValidation)
	};
};

export const actions = {
	default: async (event: RequestEvent) => {
		const form = await superValidate(event, loginValidation);

		if (!form.valid) {
			return fail(400, { form });
		}

		const response = await event.locals.api('/api/auth/login', {
			method: 'POST',
			body: JSON.stringify(form.data)
		});

		if (!response.ok) {
			let fallbackMessage = 'Connexion impossible. Vérifiez vos identifiants.';

			try {
				const errorBody = (await response.json()) as { error: string | ApiFieldError[] };

				if (Array.isArray(errorBody.error)) {
					for (const { field, message: errorMessage } of errorBody.error) {
						const normalizedField = field === 'credentials' ? 'password' : field;
						if (normalizedField in form.data) {
							setError(form, normalizedField as keyof typeof form.data, errorMessage);
						} else {
							fallbackMessage = errorMessage;
						}
					}
				} else if (typeof errorBody.error === 'string') {
					fallbackMessage = errorBody.error;
				}
			} catch (parseError) {
				console.error('Erreur lors du décodage de la réponse /api/auth/login', parseError);
			}

			if (response.status === 429) {
				fallbackMessage = 'Trop de tentatives détectées. Patientez quelques instants avant de réessayer.';
			}

			const status = response.status >= 400 && response.status <= 599 ? response.status : 400;
			return message(
				form,
				{ type: 'error', text: fallbackMessage },
				{ status: status as MessageStatus }
			);
		}

		const { data } = (await response.json()) as ApiSuccess<LoginResponse>;
		persistLogin(event, data);

		try {
			const sessionResponse = await event.locals.api('/api/auth/session');
			if (sessionResponse.ok) {
				const sessionPayload = (await sessionResponse.json()) as ApiSuccess<AuthSession>;
				event.locals.auth = sessionPayload.data;
			}
		} catch (sessionError) {
			console.error('Impossible de récupérer la session après connexion', sessionError);
		}

		const redirectTo = event.url.searchParams.get('redirectTo') ?? '/';
		throw redirect(303, redirectTo);
	}
};
