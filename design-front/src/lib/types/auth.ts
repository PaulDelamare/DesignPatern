export interface ApiSuccess<T> {
	status: number;
	message: string;
	data: T;
}

export interface ApiFieldError {
	field: string;
	message: string;
}

export interface AuthenticatedUser {
	id: string;
	email: string;
	username: string;
	role: string;
	createdAt: string;
	updatedAt: string;
}

export interface UserSummary {
	id: string;
	email: string;
	username: string;
	createdAt: string;
	updatedAt: string;
}

export interface AuthSession {
	id: string;
	user: AuthenticatedUser;
	createdAt: string;
	lastActivity: string;
	expiresAt: string;
}

export type TokenDuration = '30d' | '1d' | '15m' | '12h';

export interface LoginResponse {
	accessToken: string;
	sessionId: string;
	tokenExpiresIn: TokenDuration;
	sessionExpiresAt: string;
	user: AuthenticatedUser;
}
