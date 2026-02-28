import { trpcLoggedProcedure } from '../../lib/trpc';

import { setPostLikeTrpcInput } from './input';

export const setPostLikeTrpcRoute = trpcLoggedProcedure
  .input(setPostLikeTrpcInput)
  .mutation(async ({ ctx, input }) => {
    const { postId, isLikedByMe } = input;

    if (!ctx.me) {
      throw new Error('User not authenticated');
    }

    const post = await ctx.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!post) {
      throw new Error('Post not found');
    }

    const existingLike = await ctx.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: ctx.me.id,
        },
      },
      select: { id: true },
    });

    if (isLikedByMe) {
      if (!existingLike) {
        await ctx.prisma.postLike.create({
          data: {
            userId: ctx.me.id,
            postId,
          },
        });

        if (post.authorId !== ctx.me.id) {
          await ctx.prisma.notification.create({
            data: {
              type: 'POST_LIKED',
              recipientId: post.authorId,
              actorId: ctx.me.id,
              postId,
            },
          });
        }
      }
    } else {
      if (existingLike) {
        await ctx.prisma.$transaction([
          ctx.prisma.postLike.delete({
            where: {
              postId_userId: {
                postId,
                userId: ctx.me.id,
              },
            },
          }),
          ctx.prisma.notification.deleteMany({
            where: {
              type: 'POST_LIKED',
              recipientId: post.authorId,
              actorId: ctx.me.id,
              postId,
            },
          }),
        ]);
      }
    }

    const likesCount = await ctx.prisma.postLike.count({
      where: { postId },
    });

    return {
      post: {
        id: postId,
        likesCount,
        isLikedByMe,
      },
    };
  });
