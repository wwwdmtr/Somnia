import { trpc } from "../../lib/trpc";

import { zGetCommentsByPostTrpcInput } from "./input";

export const getCommentsByPostTrpcRoute = trpc.procedure
  .input(zGetCommentsByPostTrpcInput)
  .query(async ({ ctx, input }) => {
    const post = await ctx.prisma.post.findUnique({
      where: { id: input.postId },
      select: { id: true },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const rawComments = await ctx.prisma.comment.findMany({
      where: {
        postId: input.postId,
        parentId: null,
      },
      take: input.limit + 1,
      ...(input.cursor && {
        cursor: { id: input.cursor },
        skip: 1,
      }),
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            name: true,
          },
        },
        replies: {
          where: { deletedAt: null },
          include: {
            author: {
              select: {
                id: true,
                nickname: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            replies: {
              where: { deletedAt: null },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | null = null;
    if (rawComments.length > input.limit) {
      rawComments.pop();
      nextCursor = rawComments[rawComments.length - 1]?.id ?? null;
    }

    const comments = rawComments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: comment.author,
      repliesCount: comment._count.replies,
      replies: comment.replies,
    }));

    return { comments, nextCursor };
  });
