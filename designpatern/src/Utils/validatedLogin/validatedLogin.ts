
import passport from "passport";
import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";
import { handleError } from "../../Utils/errorHandler/errorHandler";

/**
 * Middleware function to check JWT authentication.
 *
 * @return Express middleware function
 */
export const checkAuth = () => {
    return (req: Request, res: Response, next: NextFunction) => {

        passport.authenticate("jwt", { session: false }, async (err: Error | null, user: User | false) => {
            if (err) {

                return handleError({ status: 500, error: "Erreur interne du serveur" }, req, res, 'CheckAuthAndRole');
            }

            if (!user) {

                return handleError({ status: 401, error: "Non autorisé" }, req, res, 'CheckAuthAndRole');
            }

            req.user = user;

            next();
        })(req, res, next);
    };
};