// ! IMPORTS
import vine from '@vinejs/vine';

// ! SCHEMAS
export const registerSchema = vine.object({
    email: vine.string().trim().email(),
    username: vine.string().trim().minLength(3).maxLength(64),
    password: vine.string().regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{12,}$/)
});
