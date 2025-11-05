// ! IMPORTS
import { router } from "../../config/router.config";
import { AuthController } from "../Controllers/auth.controller";
import { authenticationEnforcer } from "../Security/authenticationEnforcer";
import { checkApiKey } from "../Utils/checkApiKey/checkApiKey";

// ! Routes Authentication
const requireSession = authenticationEnforcer.checkAuthentication();

router.post('/auth/register', checkApiKey(), AuthController.register);
router.post('/auth/login', checkApiKey(), AuthController.login);
router.post('/auth/logout', checkApiKey(), requireSession, AuthController.logout);
router.get('/auth/session', checkApiKey(), requireSession, AuthController.session);

// ! EXPORT
export default router;
