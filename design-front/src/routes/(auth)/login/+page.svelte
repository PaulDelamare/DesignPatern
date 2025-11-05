<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import type { SuperValidated } from 'sveltekit-superforms';
	import { showToast } from '$lib/stores/toast';
	import { detectInjectionAttempt } from '$lib/utils/detectInjection';

	const { data } = $props<{
		data: {
			form: SuperValidated<Record<string, unknown>>;
		};
	}>();

	const superform = superForm(data.form, { applyAction: true });
	const { form, errors, message, constraints, enhance, submitting, delayed } = superform;

	const warnedPatterns = new Set<string>();
	let previousMessage: string | null = null;

	const warnOnInjection = (value: unknown, field: string) => {
		const detection = detectInjectionAttempt(value);
		if (!detection) {
			return;
		}

		const key = `${field}:${detection.pattern}`;
		if (warnedPatterns.has(key)) {
			return;
		}

		warnedPatterns.add(key);
		showToast(
			`Tentative potentielle d'injection ${detection.vector} détectée dans le champ ${field}. Merci de rester conforme aux règles.`,
			'warning'
		);
	};

	$effect(() => {
		warnOnInjection($form.email, 'email');
		warnOnInjection($form.password, 'password');
	});

	$effect(() => {
		if ($message?.text && $message.text !== previousMessage) {
			if ($message.type === 'error' && /injection/i.test($message.text)) {
				showToast($message.text, 'error', 6000);
			}
			previousMessage = $message.text;
		}
	});
</script>

<section class="auth-container">
	<header>
		<h1>Connexion</h1>
		<p>Accédez au portail sécurisé en utilisant vos identifiants.</p>
	</header>
	{#if $message}
		<div class={`alert ${$message.type}`}>{$message.text}</div>
	{/if}
	<form method="POST" use:enhance class="auth-form" aria-busy={$submitting}>
		<div class="field">
			<label for="email">Adresse e-mail</label>
			<input
				id="email"
				name="email"
				type="email"
				autocomplete="email"
				required
				bind:value={$form.email}
				{...($constraints.email ?? {})}
				aria-invalid={$errors.email ? 'true' : 'false'}
			/>
			{#if $errors.email?.length}
				<p class="error">{$errors.email[0]}</p>
			{/if}
		</div>

		<div class="field">
			<label for="password">Mot de passe</label>
			<input
				id="password"
				name="password"
				type="password"
				autocomplete="current-password"
				required
				bind:value={$form.password}
				{...($constraints.password ?? {})}
				aria-invalid={$errors.password ? 'true' : 'false'}
			/>
			{#if $errors.password?.length}
				<p class="error">{$errors.password[0]}</p>
			{/if}
		</div>

		<label class="remember">
			<input type="checkbox" name="rememberMe" bind:checked={$form.rememberMe} />
			<span>Se souvenir de moi (30 jours)</span>
		</label>

		<button type="submit" disabled={$submitting}>
			<span class="button-content">
				{#if $submitting}
					<span class="spinner" aria-hidden="true"></span>
					<span>Connexion en cours…</span>
				{:else}
					<span>Se connecter</span>
				{/if}
			</span>
		</button>
	</form>

	{#if $delayed && $submitting}
		<div class="progress" role="status" aria-live="polite">
			Connexion à l’API en cours…
		</div>
	{/if}

	<footer>
		<p>Pas encore de compte ? <a href="/register">Créer un compte</a></p>
	</footer>
</section>

<style>
	.auth-container {
		max-width: 420px;
		margin: 0 auto;
		padding: 2.5rem 2rem;
		background: rgba(30, 41, 59, 0.8);
		border-radius: 1.25rem;
		border: 1px solid rgba(148, 163, 184, 0.25);
		box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.45);
	}

	header h1 {
		margin: 0;
		font-size: 2rem;
	}

	header p {
		margin: 0.5rem 0 2rem;
		color: rgba(226, 232, 240, 0.8);
	}

	.auth-form {
		display: grid;
		gap: 1.5rem;
	}

	.field {
		display: grid;
		gap: 0.5rem;
	}

	label {
		font-weight: 600;
		color: rgba(226, 232, 240, 0.95);
	}

	.remember {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.95rem;
		color: rgba(226, 232, 240, 0.85);
	}

	input[type='email'],
	input[type='password'] {
		width: 100%;
		border-radius: 0.75rem;
		border: 1px solid rgba(148, 163, 184, 0.3);
		padding: 0.75rem 1rem;
		background: rgba(15, 23, 42, 0.5);
		color: #f8fafc;
	}

	input:focus {
		outline: none;
		border-color: #38bdf8;
		box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.35);
	}

	.error {
		margin: 0;
		font-size: 0.85rem;
		color: #f87171;
	}

	.alert {
		margin-bottom: 1.5rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		font-weight: 500;
	}

	.alert.error {
		background: rgba(248, 113, 113, 0.15);
		color: #fecaca;
	}

	button {
		padding: 0.85rem 1rem;
		border-radius: 0.75rem;
		border: none;
		font-weight: 600;
		cursor: pointer;
		background: linear-gradient(135deg, #0ea5e9, #38bdf8);
		color: #0f172a;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	button:disabled {
		cursor: wait;
		opacity: 0.85;
	}

	.button-content {
		display: inline-flex;
		align-items: center;
		gap: 0.65rem;
	}

	.spinner {
		width: 1rem;
		height: 1rem;
		border-radius: 9999px;
		border: 2px solid rgba(15, 23, 42, 0.25);
		border-top-color: rgba(15, 23, 42, 0.9);
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.progress {
		margin-top: 1.25rem;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: rgba(14, 165, 233, 0.12);
		color: #bae6fd;
		font-size: 0.95rem;
		text-align: center;
	}

	button:hover {
		transform: translateY(-1px);
		box-shadow: 0 12px 16px -8px rgba(14, 165, 233, 0.45);
	}

	footer {
		margin-top: 1.75rem;
		text-align: center;
		color: rgba(226, 232, 240, 0.75);
	}

	footer a {
		color: #38bdf8;
		text-decoration: none;
	}

	footer a:hover {
		text-decoration: underline;
	}
</style>
