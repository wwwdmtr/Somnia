import { z } from "zod";

import { trpc } from "../lib/trpc";

export const getPostTrpcRoute = trpc.procedure
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const post = await ctx.prisma.post.findUnique({
      where: { id: input.id },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });
    return { post };
  });
