// ! IMPORTS
import { User } from '@prisma/client';
import { bdd } from '../../config/prismaClient.config';
import { throwError } from '../Utils/errorHandler/errorHandler';

// ! TYPES
export type SafeUser = Omit<User, 'password'>;

type UserIdentifier = Partial<Pick<User, 'id' | 'email'>>;

// ! SERVICE
export class UserServices {
    static async checkExistUser(where: UserIdentifier, includePassword: boolean = false): Promise<User | SafeUser> {
        if (!where.id && !where.email) {
            throwError(400, 'Aucun identifiant utilisateur fourni');
        }

        const user = await bdd.user.findFirst({ where });

        if (!user) {
            throwError(404, 'Utilisateur introuvable');
        }

        const ensuredUser = user as User;

        if (includePassword) {
            return ensuredUser;
        }

        const { password, ...safeUser } = ensuredUser;
        return safeUser;
    }
}
