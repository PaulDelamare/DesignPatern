import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { superValidate, setError, message } from 'sveltekit-superforms/server';
import { zod, type ZodValidation } from 'sveltekit-superforms/adapters';
import { registerSchema, registerPasswordMismatchMessage } from '$lib/schemas/auth';
import type { ApiFieldError } from '$lib/types/auth';

const registerValidation = zod(registerSchema as unknown as ZodValidation);
type MessageOptions = NonNullable<Parameters<typeof message>[2]>;
type MessageStatus = MessageOptions extends { status?: infer S } ? S : never;

export const load = async ({ locals }: { locals: App.Locals }) => {
	if (locals.auth) {
		throw redirect(303, '/');
	}

	return {
		form: await superValidate(registerValidation)
	};
};

export const actions = {
	default: async (event: RequestEvent) => {
		const form = await superValidate(event, registerValidation);

		if (!form.valid) {
			return fail(400, { form });
		}

		if (form.data.password !== form.data.confirmPassword) {
			setError(form, 'confirmPassword', registerPasswordMismatchMessage);
			return message(
				form,
				{ type: 'error', text: registerPasswordMismatchMessage },
				{ status: 400 as MessageStatus }
			);
		}

		const { email, username, password } = form.data;

		const response = await event.locals.api('/api/auth/register', {
			method: 'POST',
			body: JSON.stringify({ email, username, password })
		});

		if (!response.ok) {
			let fallbackMessage = "Inscription impossible. Veuillez corriger les informations fournies.";

			try {
				const errorBody = (await response.json()) as { error: string | ApiFieldError[] };

				if (Array.isArray(errorBody.error)) {
					for (const { field, message: errorMessage } of errorBody.error) {
						if (field in form.data) {
							setError(form, field as keyof typeof form.data, errorMessage);
						} else {
							fallbackMessage = errorMessage;
						}
					}
				} else if (typeof errorBody.error === 'string') {
					fallbackMessage = errorBody.error;
				}
			} catch (parseError) {
				console.error('Erreur lors du décodage de la réponse /api/auth/register', parseError);
			}

			const status = response.status >= 400 && response.status <= 599 ? response.status : 400;
			return message(form, { type: 'error', text: fallbackMessage }, { status: status as MessageStatus });
		}

		await response.json();

		return message(form, {
			type: 'success',
			text: 'Compte créé avec succès. Vous pouvez maintenant vous connecter.'
		});
	}
};
