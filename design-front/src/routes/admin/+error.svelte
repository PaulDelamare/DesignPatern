<script lang="ts">
	interface AdminPageError {
		status?: number;
		message?: string;
	}

	const { error } = $props<{
		error: AdminPageError;
	}>();

	const status = error?.status ?? 404;
	const heading = status === 404 ? 'Page introuvable' : 'Une erreur est survenue';
	const description =
		error?.message ??
		(status === 404
			? "La ressource demandée est introuvable ou n'est plus disponible."
			: "Un problème inattendu est survenu. Veuillez réessayer plus tard.");
</script>

<section class="admin-error">
	<h1>{heading}</h1>
	<p>{description}</p>
	<a class="admin-error__link" href="/">Revenir à l&#39;accueil</a>
</section>

<style>
	.admin-error {
		min-height: 50vh;
		display: grid;
		place-content: center;
		gap: 1.25rem;
		text-align: center;
	}

	.admin-error h1 {
		margin: 0;
		font-size: 2rem;
	}

	.admin-error p {
		margin: 0;
		color: rgba(226, 232, 240, 0.75);
		max-width: 420px;
		justify-self: center;
	}

	.admin-error__link {
		display: inline-block;
		padding: 0.75rem 1.25rem;
		border-radius: 0.75rem;
		background: linear-gradient(135deg, #f97316, #fb923c);
		color: #0f172a;
		text-decoration: none;
		font-weight: 600;
	}

	.admin-error__link:hover {
		opacity: 0.9;
	}
</style>
