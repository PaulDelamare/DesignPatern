<script lang="ts">
	const { data } = $props<{
		data: App.PageData;
	}>();

	const auth = $derived(data.auth);
</script>

<section class="admin-dashboard">
	<header class="admin-header">
		<h1>Espace administrateur</h1>
		{#if auth}
			<p>Bienvenue {auth.user.username}, vous disposez des privilèges complets pour superviser la plateforme.</p>
		{:else}
			<p>Chargement de votre session…</p>
		{/if}
	</header>

	<div class="admin-grid">
		<article class="admin-card">
			<h2>Gestion des utilisateurs</h2>
			<p>Consultez, créez ou désactivez des comptes. Vérifiez les rôles accordés et surveillez les accès sensibles.</p>
			<a class="admin-link" href="/">Accéder à la liste des utilisateurs</a>
		</article>

		<article class="admin-card">
			<h2>Surveillance de la sécurité</h2>
			<p>Gardez un œil sur les journaux d&#39;activité et les tentatives d&#39;intrusion détectées par l&#39;API.</p>
			<button class="admin-link" type="button" disabled>Télémetrie à venir</button>
		</article>

		<article class="admin-card">
			<h2>Configuration</h2>
			<p>Ajustez les paramètres globaux : limites de taux, clés API et politiques de durcissement.</p>
			<button class="admin-link" type="button" disabled>Console à venir</button>
		</article>
	</div>

	{#if auth}
		<section class="admin-meta">
			<h2>Résumé de la session</h2>
			<ul>
				<li><span>Identifiant session :</span> {auth.id}</li>
				<li><span>Email :</span> {auth.user.email}</li>
				<li><span>Rôle :</span> {auth.user.role}</li>
				<li><span>Expiration :</span> {new Date(auth.expiresAt).toLocaleString()}</li>
			</ul>
		</section>
	{/if}
</section>

<style>
	.admin-dashboard {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	.admin-header h1 {
		margin: 0;
		font-size: 2.25rem;
	}

	.admin-header p {
		margin: 0.75rem 0 0;
		color: rgba(226, 232, 240, 0.75);
	}

	.admin-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.5rem;
	}

	.admin-card {
		padding: 1.75rem;
		border-radius: 1rem;
		border: 1px solid rgba(148, 163, 184, 0.2);
		background: rgba(15, 23, 42, 0.65);
		box-shadow: 0 18px 32px -16px rgba(15, 23, 42, 0.65);
		transition: transform 0.15s ease, box-shadow 0.15s ease;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.admin-card h2 {
		margin: 0;
		font-size: 1.25rem;
	}

	.admin-card p {
		margin: 0;
		flex: 1 1 auto;
		color: rgba(226, 232, 240, 0.7);
	}

	.admin-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 24px 40px -14px rgba(14, 116, 233, 0.45);
	}

	.admin-link {
		align-self: flex-start;
		padding: 0.6rem 1rem;
		border-radius: 0.7rem;
		background: linear-gradient(120deg, #1d4ed8, #38bdf8);
		color: #0f172a;
		text-decoration: none;
		font-weight: 600;
		border: none;
		cursor: pointer;
	}

	.admin-link:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.admin-link:not(:disabled):hover {
		opacity: 0.9;
	}

	.admin-meta {
		border-radius: 1rem;
		border: 1px solid rgba(148, 163, 184, 0.2);
		background: rgba(15, 23, 42, 0.55);
		padding: 1.75rem;
	}

	.admin-meta h2 {
		margin: 0 0 1rem;
	}

	.admin-meta ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.65rem;
	}

	.admin-meta li span {
		color: rgba(148, 163, 184, 0.85);
		margin-right: 0.5rem;
	}

	@media (max-width: 640px) {
		.admin-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
