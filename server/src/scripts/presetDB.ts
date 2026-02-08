import { type AppContext } from "../lib/ctx";
import { env } from "../lib/env";
import { getPasswordHash } from "../utils/getPasswordHash";

export const presetDB = async (ctx: AppContext) => {
  await ctx.prisma.user.upsert({
    where: {
      nickname: env.ADMIN_NICKNAME,
    },
    create: {
      nickname: env.ADMIN_NICKNAME,
      password: getPasswordHash(env.ADMIN_PASSWORD),
      permissions: ["ALL"],
    },
    update: {
      permissions: ["ALL"],
    },
  });
};
