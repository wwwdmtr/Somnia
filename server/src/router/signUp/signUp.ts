import { trpc } from "../../lib/trpc";
import { getPasswordHash } from "../../utils/getPasswordHash";

import { zSignUpTrpcInput } from "./input";

export const signUpTrpcRoute = trpc.procedure
  .input(zSignUpTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const exUser = await ctx.prisma.user.findUnique({
      where: {
        nickname: input.nickname,
      },
    });

    if (exUser) {
      throw new Error("Nickname is already taken.");
    }

    await ctx.prisma.user.create({
      data: {
        nickname: input.nickname,
        password: getPasswordHash(input.password),
      },
    });

    return true;
  });
