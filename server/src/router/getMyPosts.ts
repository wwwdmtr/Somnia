import { z } from "zod";

import { trpc } from "../lib/trpc";

export const getMyPostsTrpcRoute = trpc.procedure
  .input(
    z.object({
      authorId: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const posts = await ctx.prisma.post.findMany({
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

    return { posts };
  });
