import { trpc } from "../../lib/trpc";
import { getPasswordHash } from "../../utils/getPasswordHash";
import { signJWT } from "../../utils/signJWT";

import { zSignUpTrpcInput } from "./input";

export const signUpTrpcRoute = trpc.procedure
  .input(zSignUpTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const exUserWithNick = await ctx.prisma.user.findUnique({
      where: {
        nickname: input.nickname,
      },
    });
    if (exUserWithNick) {
      throw new Error("User with this nick already exists");
    }
    const exUserWithEmail = await ctx.prisma.user.findUnique({
      where: {
        email: input.email,
      },
    });
    if (exUserWithEmail) {
      throw new Error("User with this email already exists");
    }

    const user = await ctx.prisma.user.create({
      data: {
        nickname: input.nickname,
        email: input.email,
        password: getPasswordHash(input.password),
      },
    });

    const token = signJWT(user.id);

    return { token };
  });
