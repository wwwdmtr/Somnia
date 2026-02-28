import { sendPostBlockedEmail } from '../../lib/emails';
import { trpcLoggedProcedure } from '../../lib/trpc';
import { canDeleteThisPost, isPostOwner } from '../../utils/can';

import { zDeletePostTrpcInput } from './input';

export const deletePostTrpcRoute = trpcLoggedProcedure
  .input(zDeletePostTrpcInput)
  .mutation(async ({ ctx, input }) => {
    const { postId } = input;

    const post = await ctx.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        deletedAt: true,
        title: true,
        author: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!post || post.deletedAt) {
      throw new Error('Post not found');
    }

    if (!canDeleteThisPost(ctx.me, post)) {
      throw new Error('Unauthorized');
    }

    await ctx.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    if (!isPostOwner(ctx.me, post)) {
      void sendPostBlockedEmail({ user: post.author, post });
    }

    return true;
  });
