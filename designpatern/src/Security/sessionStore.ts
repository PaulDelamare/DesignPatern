// ! TYPES
import { AuthSession } from './authenticationEnforcer';

// ! INTERFACES
export interface SessionStore {
    set(session: AuthSession): void;
    get(sessionId: string): AuthSession | undefined;
    delete(sessionId: string): void;
    entries(): IterableIterator<[string, AuthSession]>;
}

// ! IMPLEMENTATIONS
export class InMemorySessionStore implements SessionStore {
    private readonly sessions = new Map<string, AuthSession>();

    set(session: AuthSession): void {
        this.sessions.set(session.id, session);
    }

    get(sessionId: string): AuthSession | undefined {
        return this.sessions.get(sessionId);
    }

    delete(sessionId: string): void {
        this.sessions.delete(sessionId);
    }

    entries(): IterableIterator<[string, AuthSession]> {
        return this.sessions.entries();
    }
}
