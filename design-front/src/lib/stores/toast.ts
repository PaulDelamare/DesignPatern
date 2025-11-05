import { writable } from 'svelte/store';

export type ToastLevel = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
	id: number;
	level: ToastLevel;
	message: string;
	createdAt: number;
}

const toasts = writable<ToastMessage[]>([]);
let counter = 0;

export const showToast = (message: string, level: ToastLevel = 'info', ttl = 4000): number => {
	const id = ++counter;
	const createdAt = Date.now();

	toasts.update((current) => [...current, { id, level, message, createdAt }]);

	if (ttl > 0) {
		setTimeout(() => dismissToast(id), ttl);
	}

	return id;
};

export const dismissToast = (id: number) => {
	toasts.update((current) => current.filter((toast) => toast.id !== id));
};

export default toasts;
