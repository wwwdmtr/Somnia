import { trpc } from "../../lib/trpc";
import { getPasswordHash } from "../../utils/getPasswordHash";

import { zSignInTrpcInput } from "./input";

export const signInTrpcRoute = trpc.procedure
  .input(zSignInTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const user = await ctx.prisma.user.findFirst({
      where: {
        nickname: input.nickname,
        password: getPasswordHash(input.password),
      },
    });
    if (!user) {
      throw new Error("Invalid nickname or password");
    }

    return true;
  });
