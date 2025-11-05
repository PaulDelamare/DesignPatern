import { z } from 'zod';

const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,}$/;

export const loginSchema = z
    .object({
        email: z
            .string({ required_error: "L'email est requis" })
            .email({ message: 'Format de courriel invalide' })
            .trim(),
        password: z
            .string({ required_error: 'Le mot de passe est requis' })
            .regex(passwordRegex, {
                message:
                    'Le mot de passe doit contenir au moins 12 caractères dont une majuscule, une minuscule, un chiffre et un caractère spécial'
            }),
        rememberMe: z.boolean().optional().default(false)
    })
    .strip();

const baseRegisterSchema = z.object({
	email: z
		.string({ required_error: "L'email est requis" })
		.email({ message: 'Format de courriel invalide' })
		.trim(),
	username: z
		.string({ required_error: "Le nom d'utilisateur est requis" })
		.min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères")
		.max(20, "Le nom d'utilisateur doit contenir au maximum 20 caractères")
		.regex(/^[a-zA-Z0-9_\-.]+$/, 'Caractères autorisés: lettres, chiffres, _ - .'),
	password: z
		.string({ required_error: 'Le mot de passe est requis' })
		.regex(passwordRegex, {
			message:
				'Le mot de passe doit contenir au moins 12 caractères dont une majuscule, une minuscule, un chiffre et un caractère spécial'
		}),
	confirmPassword: z
		.string({ required_error: 'La confirmation du mot de passe est requise' })
});

	export const registerSchema = baseRegisterSchema;
	export const registerPasswordMismatchMessage = 'Les mots de passe ne correspondent pas';

export type LoginSchema = typeof loginSchema;
export type RegisterSchema = typeof registerSchema;
