import _ from 'lodash';
import { z } from 'zod';

import { trpcLoggedProcedure } from '../lib/trpc';

export const getMyPostsTrpcRoute = trpcLoggedProcedure
  .input(
    z.object({
      authorId: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const userId = ctx.me?.id;

    const rawPosts = await ctx.prisma.post.findMany({
      where: {
        authorId: input.authorId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
          },
        },
        postLikes: userId
          ? {
              where: {
                userId,
              },
              select: {
                id: true,
              },
            }
          : false,
        _count: {
          select: {
            postLikes: true,
          },
        },
      },
    });

    const posts = rawPosts.map((post) => ({
      ..._.omit(post, ['_count', 'postLikes']),
      likesCount: post._count.postLikes,
      isLikedByMe: post.postLikes.length > 0,
    }));

    return { posts };
  });
