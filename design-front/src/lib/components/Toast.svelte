<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import toasts, { dismissToast, type ToastMessage } from '$lib/stores/toast';

	const levelIcon: Record<ToastMessage['level'], string> = {
		info: 'ℹ️',
		success: '✅',
		warning: '⚠️',
		error: '⛔'
	};
</script>

<div class="toast-container" aria-live="polite" aria-atomic="true">
	{#each $toasts as toast (toast.id)}
		<div
			class={`toast toast-${toast.level}`}
			in:fly={{ y: 12, duration: 160 }}
			out:fade={{ duration: 140 }}
			role="status"
		>
			<span class="toast-icon" aria-hidden="true">{levelIcon[toast.level]}</span>
			<span class="toast-message">{toast.message}</span>
			<button type="button" class="toast-close" on:click={() => dismissToast(toast.id)} aria-label="Fermer le message">
				×
			</button>
		</div>
	{/each}
</div>

<style>
	.toast-container {
		position: fixed;
		top: 1.25rem;
		right: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		z-index: 9999;
	}

	.toast {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		min-width: 280px;
		box-shadow: 0 12px 30px -16px rgba(15, 23, 42, 0.7);
		background: rgba(15, 23, 42, 0.92);
		color: #e2e8f0;
	}

	.toast-info {
		border-left: 4px solid #38bdf8;
	}

	.toast-success {
		border-left: 4px solid #4ade80;
	}

	.toast-warning {
		border-left: 4px solid #fbbf24;
	}

	.toast-error {
		border-left: 4px solid #f87171;
	}

	.toast-icon {
		font-size: 1.25rem;
	}

	.toast-message {
		font-size: 0.95rem;
		line-height: 1.4;
	}

	.toast-close {
		background: transparent;
		border: none;
		color: inherit;
		font-size: 1rem;
		cursor: pointer;
		padding: 0.25rem;
	}

	.toast-close:hover {
		opacity: 0.75;
	}
</style>
