// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { AuthSession, LoginResponse, UserSummary } from '$lib/types/auth';

declare global {
	namespace App {
		interface AuthTokens {
			sessionId: string;
			accessToken: string;
			tokenExpiresIn: LoginResponse['tokenExpiresIn'];
			sessionExpiresAt: string | null;
		}

		interface Locals {
			auth: AuthSession | null;
			tokens: AuthTokens | null;
			api: (path: string, init?: RequestInit) => Promise<Response>;
		}

		interface PageData {
			auth: AuthSession | null;
			users: UserSummary[] | null;
			usersError: string | null;
		}
	}
}

export {};
