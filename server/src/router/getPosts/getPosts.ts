import { trpc } from "../../lib/trpc";

import { zGetPostsTrpcInput } from "./input";

export const getPostsTrpcRoute = trpc.procedure
  .input(zGetPostsTrpcInput)
  .query(async ({ ctx, input }) => {
    const posts = await ctx.prisma.post.findMany({
      take: input.limit + 1,
      ...(input.cursor && {
        cursor: { seq: input.cursor },
        skip: 1,
      }),
      orderBy: {
        seq: "desc",
      },
      select: {
        id: true,
        seq: true,
        title: true,
        text: true,
        createdAt: true,
        author: { select: { nickname: true } },
      },
    });

    let nextCursor: number | null = null;
    if (posts.length > input.limit) {
      posts.pop();
      nextCursor = posts[posts.length - 1]?.seq ?? null;
    }

    return { posts, nextCursor };
  });
