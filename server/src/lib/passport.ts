import { type Express } from "express";
import { Passport } from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";

import { type AppContext } from "./ctx";
import { env } from "./env";

export const applyPassportToExpressApp = (
  expressApp: Express,
  ctx: AppContext,
): void => {
  const passport = new Passport();

  type JwtPayload = { userId?: string };

  passport.use(
    new JwtStrategy(
      {
        secretOrKey: env.JWT_SECRET,
        jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("Bearer"),
      },
      (jwtPayload: JwtPayload, done) => {
        const userId = jwtPayload.userId;
        if (!userId) {
          return done(null, false);
        }

        ctx.prisma.user
          .findUnique({ where: { id: userId } })
          .then((user) => done(null, user ?? false))
          .catch((err) => done(err, false));
      },
    ),
  );

  expressApp.use((req, res, next) => {
    if (!req.headers.authorization) {
      next();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    passport.authenticate("jwt", { session: false }, (...args: any[]) => {
      req.user = args[1] || undefined;
      next();
    })(req, res, next);
  });
};
