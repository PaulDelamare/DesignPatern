<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import Toast from '$lib/components/Toast.svelte';

	const { data, children } = $props<{
		data: App.PageData;
		children: () => unknown;
	}>();

	const auth = $derived(data.auth);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell">
	<header class="app-header">
		<nav class="app-nav">
			<a class="brand" href="/">Design Front</a>
			<div class="nav-links">
				{#if auth}
					<span class="welcome">Connecté en tant que {auth.user.username}</span>
					{#if auth.user.role === 'ADMIN'}
						<a href="/admin">Espace admin</a>
					{/if}
					<form method="POST" action="/logout" class="logout-form">
						<button type="submit">Déconnexion</button>
					</form>
				{:else}
					<a href="/login">Connexion</a>
					<a href="/register">Inscription</a>
				{/if}
			</div>
		</nav>
	</header>
	<main class="app-main">{@render children()}</main>
	<footer class="app-footer">© {new Date().getFullYear()} Sécurité applicative</footer>
</div>

<Toast />

<style>
	.app-shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		background: #0f172a;
		color: #f8fafc;
	}

	.app-header {
		background: rgba(15, 23, 42, 0.85);
		border-bottom: 1px solid rgba(148, 163, 184, 0.25);
		backdrop-filter: blur(8px);
	}

	.app-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		max-width: 960px;
		margin: 0 auto;
		padding: 1rem;
	}

	.brand {
		font-weight: 600;
		font-size: 1.25rem;
		color: #38bdf8;
		text-decoration: none;
	}

	.brand:hover {
		text-decoration: underline;
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.nav-links a {
		color: #f1f5f9;
		text-decoration: none;
		font-weight: 500;
	}

	.nav-links a:hover {
		text-decoration: underline;
	}

	.logout-form button {
		background: #ef4444;
		color: #f8fafc;
		border: none;
		border-radius: 0.375rem;
		padding: 0.5rem 0.875rem;
		cursor: pointer;
		font-weight: 600;
	}

	.logout-form button:hover {
		background: #dc2626;
	}

	.app-main {
		flex: 1 1 auto;
		max-width: 960px;
		margin: 0 auto;
		padding: 2.5rem 1rem;
	}

	.app-footer {
		text-align: center;
		font-size: 0.875rem;
		padding: 1rem;
		color: rgba(226, 232, 240, 0.55);
	}

	.welcome {
		font-size: 0.95rem;
		color: rgba(226, 232, 240, 0.85);
	}

	@media (max-width: 640px) {
		.app-nav {
			flex-direction: column;
			align-items: flex-start;
		}

		.nav-links {
			flex-direction: column;
			align-items: flex-start;
			width: 100%;
		}

		.logout-form button {
			width: 100%;
		}
	}
</style>
