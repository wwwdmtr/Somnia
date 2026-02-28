import { trpcLoggedProcedure } from '../../lib/trpc';
import { isUserAdmin } from '../../utils/can';

import { zUndoDeletePostTrpcInput } from './input';

export const undoDeletePostTrpcRoute = trpcLoggedProcedure
  .input(zUndoDeletePostTrpcInput)
  .mutation(async ({ ctx, input }) => {
    const { postId } = input;

    const post = await ctx.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, deletedAt: true },
    });

    if (!post || !post.deletedAt) {
      throw new Error('Post not found');
    }

    if (!isUserAdmin(ctx.me)) {
      throw new Error('Unauthorized');
    }

    await ctx.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: null },
    });

    return true;
  });
