import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { bdd } from './prismaClient.config';
import { PassportStatic } from 'passport';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '@prisma/client';

//Passport
const opts: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET as string,
};

interface JwtPayloadExtended extends JwtPayload {
    email: string;
}

export default (passport: PassportStatic) => {
    passport.use(
        new JwtStrategy(opts, async (jwt_payload: JwtPayloadExtended, done: (error: any, user?: (User) | false) => void) => {
            try {
                const user = await bdd.user.findUnique({
                    where: {
                        email: jwt_payload.email,
                    },
                });
                if (user) {
                    return done(null, user);
                }
                return done(null, false);
            } catch (error) {
                return done(error, false);
            }
        }),
    );
};
