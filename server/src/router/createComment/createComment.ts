import { trpcLoggedProcedure } from '../../lib/trpc';

import { zCreateCommentTrpcInput } from './input';

export const createCommentTrpcRoute = trpcLoggedProcedure
  .input(zCreateCommentTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error('Unauthorized');
    }

    const post = await ctx.prisma.post.findUnique({
      where: { id: input.postId },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    let parentComment: { id: string; postId: string; authorId: string } | null =
      null;
    if (input.parentId) {
      parentComment = await ctx.prisma.comment.findUnique({
        where: { id: input.parentId },
        select: { id: true, postId: true, authorId: true },
      });
      if (!parentComment) {
        throw new Error('Parent comment not found');
      }

      if (parentComment.postId !== input.postId) {
        throw new Error("Parent comment doesn't belong to this post");
      }
    }

    const comment = await ctx.prisma.comment.create({
      data: {
        content: input.content,
        postId: input.postId,
        authorId: ctx.me.id,
        parentId: input.parentId ?? null,
      },
    });

    const notificationsToCreate: Array<{
      type: 'POST_COMMENTED' | 'COMMENT_REPLIED';
      recipientId: string;
      actorId: string;
      postId: string;
      commentId: string;
    }> = [];

    if (post.authorId !== ctx.me.id) {
      notificationsToCreate.push({
        type: 'POST_COMMENTED',
        recipientId: post.authorId,
        actorId: ctx.me.id,
        postId: input.postId,
        commentId: comment.id,
      });
    }

    if (parentComment && parentComment.authorId !== ctx.me.id) {
      const existingNotificationIndex = notificationsToCreate.findIndex(
        (notification) => notification.recipientId === parentComment.authorId,
      );

      if (existingNotificationIndex >= 0) {
        const existingNotification =
          notificationsToCreate[existingNotificationIndex];
        if (existingNotification) {
          existingNotification.type = 'COMMENT_REPLIED';
        }
      } else {
        notificationsToCreate.push({
          type: 'COMMENT_REPLIED',
          recipientId: parentComment.authorId,
          actorId: ctx.me.id,
          postId: input.postId,
          commentId: comment.id,
        });
      }
    }

    if (notificationsToCreate.length > 0) {
      await ctx.prisma.notification.createMany({
        data: notificationsToCreate,
      });
    }

    return comment;
  });
