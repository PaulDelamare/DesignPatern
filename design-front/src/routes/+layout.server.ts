export const load = async ({ locals }: { locals: App.Locals }) => {
	return {
		auth: locals.auth,
		users: null,
		usersError: null
	};
};
