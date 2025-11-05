// ! IMPORTS
import vine from '@vinejs/vine';

// ! SCHEMAS
export const loginSchema = vine.object({
    email: vine.string().trim().email(),
    password: vine.string()
        .regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,}$/),
    rememberMe: vine.boolean().optional()
});
