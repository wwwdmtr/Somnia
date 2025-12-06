import { z } from "zod";

import { trpc } from "../lib/trpc";

export const getMyDreamsTrpcRoute = trpc.procedure
  .input(
    z.object({
      authorId: z.string(), // сюда передаём me.id
    }),
  )
  .query(async ({ ctx, input }) => {
    const dreams = await ctx.prisma.dream.findMany({
      where: {
        authorId: input.authorId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    return { dreams };
  });
