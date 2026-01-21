import { trpc } from "../../lib/trpc";

import { zDeleteCommentTrpcInput } from "./input";

export const deleteCommentTrpcRoute = trpc.procedure
  .input(zDeleteCommentTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const comment = await ctx.prisma.comment.findUnique({
      where: { id: input.commentId },
      include: {
        replies: { select: { id: true } },
      },
    });

    if (!comment) {
      throw new Error("Комментарий не найден");
    }

    if (comment.authorId !== ctx.me.id) {
      throw new Error("Нет прав на удаление");
    }

    if (comment.parentId) {
      await ctx.prisma.comment.delete({
        where: { id: comment.id },
      });

      return { deleted: true };
    }

    if (comment.replies.length === 0) {
      await ctx.prisma.comment.delete({
        where: { id: comment.id },
      });
    } else {
      await ctx.prisma.comment.update({
        where: { id: comment.id },
        data: {
          deletedAt: new Date(),
          content: "[Комментарий удалён]",
        },
      });
    }

    return { deleted: true };
  });
