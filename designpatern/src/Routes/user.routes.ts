// ! IMPORTS
import { router } from "../../config/router.config";
import { UserController } from "../Controllers/user.controller";
import { checkApiKey } from "../Utils/checkApiKey/checkApiKey";
import { authenticationEnforcer } from "../Security/authenticationEnforcer";
import { requirePermission, requireSelfOrPermission } from "../Security/authorizationEnforcer";

// ! Middlewares communs
const requireSession = authenticationEnforcer.checkAuthentication();

// ! Requêtes pour les utilisateurs
router.get('/users', checkApiKey(), requireSession, requirePermission('admin', 'users'), UserController.getAllUsers);
router.post('/users', checkApiKey(), requireSession, requirePermission('admin', 'users'), UserController.createUser);
router.get(
	'/users/:id',
	checkApiKey(),
	requireSession,
	requireSelfOrPermission('admin', 'user', (req) => req.params.id),
	UserController.getUserById
);
router.get('/dashboard', checkApiKey(), requireSession, requirePermission('admin', 'dashboard'), UserController.dashboard);


// ! EXPORT
export default router;