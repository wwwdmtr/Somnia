import crypto from "crypto";

import { trpc } from "../../lib/trpc";

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
        password: crypto
          .createHash("sha256")
          .update(input.password)
          .digest("hex"),
      },
    });

    return true;
  });
