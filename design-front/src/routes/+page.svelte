<script lang="ts">
	const { data } = $props<{
		data: App.PageData;
	}>();

	const auth = $derived(data.auth);
	const users = $derived(data.users);
	const usersError = $derived(data.usersError);
</script>

<section class="hero">
	<h1>Portail sécurisé</h1>
	{#if auth}
		<p>
			Bienvenue {auth.user.username}! Votre rôle est <strong>{auth.user.role}</strong> et votre session arrive à
			expiration le {new Date(auth.expiresAt).toLocaleString()}.
		</p>
		<div class="card">
			<h2>Informations de session</h2>
			<ul>
				<li><span>ID session:</span> {auth.id}</li>
				<li><span>Email:</span> {auth.user.email}</li>
				<li><span>Créée le:</span> {new Date(auth.createdAt).toLocaleString()}</li>
				<li><span>Dernière activité:</span> {new Date(auth.lastActivity).toLocaleString()}</li>
			</ul>
		</div>

		{#if auth.user.role === 'ADMIN'}
			<section class="card admin-card">
				<div class="card-header">
					<h2>Gestion des utilisateurs</h2>
					<p>Accès réservé aux administrateurs. Vous disposez d’une visibilité complète sur les comptes.</p>
				</div>

				{#if usersError}
					<p class="admin-error">{usersError}</p>
				{:else if users && users.length === 0}
					<p class="admin-empty">Aucun utilisateur enregistré pour le moment.</p>
				{:else if users}
					<div class="table-wrapper">
						<table>
							<thead>
								<tr>
									<th>Nom d'utilisateur</th>
									<th>Email</th>
									<th>Créé le</th>
									<th>Mise à jour le</th>
								</tr>
							</thead>
							<tbody>
								{#each users as user}
									<tr>
										<td>{user.username}</td>
										<td>{user.email}</td>
										<td>{new Date(user.createdAt).toLocaleString()}</td>
										<td>{new Date(user.updatedAt).toLocaleString()}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="admin-empty">Chargement des utilisateurs…</p>
				{/if}
			</section>
		{:else}
			<p class="role-hint">
				Vous êtes connecté en tant que rôle <strong>{auth.user.role}</strong>. Certaines fonctionnalités restent
				réservées aux administrateurs.
			</p>
		{/if}
	{:else}
		<p>
			Authentifiez-vous pour accéder au tableau de bord sécurisé, gérer vos informations et profiter des services
			disponibles.
		</p>
		<div class="actions">
			<a class="button primary" href="/login">Se connecter</a>
			<a class="button secondary" href="/register">Créer un compte</a>
		</div>
	{/if}
</section>

<style>
	.hero {
		background: rgba(30, 41, 59, 0.75);
		border: 1px solid rgba(148, 163, 184, 0.2);
		border-radius: 1rem;
		padding: 2.5rem;
		box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.4);
		max-width: 720px;
		margin: 0 auto;
	}

	.hero h1 {
		margin: 0 0 1.25rem;
		font-size: 2rem;
		font-weight: 700;
	}

	.hero p {
		margin: 0 0 1.5rem;
		line-height: 1.7;
		color: rgba(226, 232, 240, 0.9);
	}

	.card {
		background: rgba(15, 23, 42, 0.65);
		border-radius: 0.75rem;
		padding: 1.5rem;
		border: 1px solid rgba(148, 163, 184, 0.2);
	}

	.admin-card {
		margin-top: 1.75rem;
		display: grid;
		gap: 1.25rem;
	}

	.card-header h2 {
		margin: 0;
	}

	.card-header p {
		margin: 0.5rem 0 0;
		color: rgba(226, 232, 240, 0.75);
	}

	.table-wrapper {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 540px;
	}

	table th,
	table td {
		text-align: left;
		padding: 0.75rem 0.5rem;
		border-bottom: 1px solid rgba(148, 163, 184, 0.15);
	}

	table th {
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: rgba(148, 163, 184, 0.9);
	}

	table tbody tr:hover {
		background-color: rgba(30, 41, 59, 0.45);
	}

	.admin-error {
		margin: 0;
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
		background: rgba(248, 113, 113, 0.15);
		color: #fecaca;
	}

	.admin-empty {
		margin: 0;
		color: rgba(226, 232, 240, 0.75);
	}

	.role-hint {
		margin-top: 1.5rem;
		padding: 1rem;
		border-radius: 0.75rem;
		background: rgba(56, 189, 248, 0.12);
		color: #bae6fd;
	}

	.card h2 {
		margin-top: 0;
		font-size: 1.25rem;
		margin-bottom: 1rem;
	}

	.card ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.75rem;
	}

	.card li {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		color: rgba(226, 232, 240, 0.85);
	}

	.card span {
		font-weight: 600;
		color: #38bdf8;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 1.5rem;
		border-radius: 0.75rem;
		font-weight: 600;
		text-decoration: none;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.button:hover {
		transform: translateY(-1px);
		box-shadow: 0 12px 16px -8px rgba(14, 165, 233, 0.45);
	}

	.primary {
		background: linear-gradient(135deg, #0ea5e9, #38bdf8);
		color: #0f172a;
	}

	.secondary {
		background: transparent;
		border: 1px solid rgba(148, 163, 184, 0.4);
		color: #f8fafc;
	}

	@media (max-width: 540px) {
		.hero {
			padding: 1.75rem;
		}

		.card-header p {
			font-size: 0.9rem;
		}

		.actions {
			flex-direction: column;
		}
	}
</style>
