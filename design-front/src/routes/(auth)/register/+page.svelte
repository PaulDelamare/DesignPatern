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
	const { form, errors, message, constraints, enhance } = superform;

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
		warnOnInjection($form.username, 'username');
		warnOnInjection($form.password, 'password');
		warnOnInjection($form.confirmPassword, 'confirmPassword');
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
		<h1>Créer un compte</h1>
		<p>Rejoignez la plateforme sécurisée et bénéficiez de tous les services.</p>
	</header>
	{#if $message}
		<div class={`alert ${$message.type}`}>{$message.text}</div>
	{/if}
	<form method="POST" use:enhance class="auth-form">
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
			<label for="username">Nom d'utilisateur</label>
			<input
				id="username"
				name="username"
				type="text"
				autocomplete="username"
				required
				bind:value={$form.username}
				{...($constraints.username ?? {})}
				aria-invalid={$errors.username ? 'true' : 'false'}
			/>
			{#if $errors.username?.length}
				<p class="error">{$errors.username[0]}</p>
			{/if}
		</div>

		<div class="field">
			<label for="password">Mot de passe</label>
			<input
				id="password"
				name="password"
				type="password"
				autocomplete="new-password"
				required
				bind:value={$form.password}
				{...($constraints.password ?? {})}
				aria-invalid={$errors.password ? 'true' : 'false'}
			/>
			{#if $errors.password?.length}
				<p class="error">{$errors.password[0]}</p>
			{/if}
		</div>

		<div class="field">
			<label for="confirmPassword">Confirmation du mot de passe</label>
			<input
				id="confirmPassword"
				name="confirmPassword"
				type="password"
				autocomplete="new-password"
				required
				bind:value={$form.confirmPassword}
				aria-invalid={$errors.confirmPassword ? 'true' : 'false'}
			/>
			{#if $errors.confirmPassword?.length}
				<p class="error">{$errors.confirmPassword[0]}</p>
			{/if}
		</div>

		<button type="submit">Créer mon compte</button>
	</form>

	<footer>
		<p>Déjà inscrit ? <a href="/login">Se connecter</a></p>
	</footer>
</section>

<style>
	.auth-container {
		max-width: 460px;
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

	input[type='email'],
	input[type='text'],
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

	.alert.success {
		background: rgba(34, 197, 94, 0.15);
		color: #bbf7d0;
	}

	button {
		padding: 0.85rem 1rem;
		border-radius: 0.75rem;
		border: none;
		font-weight: 600;
		cursor: pointer;
		background: linear-gradient(135deg, #22c55e, #86efac);
		color: #064e3b;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	button:hover {
		transform: translateY(-1px);
		box-shadow: 0 12px 16px -8px rgba(34, 197, 94, 0.35);
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
