import { trpcLoggedProcedure } from '../../lib/trpc';

import { zCreatePostTrpcInput } from './input';

export const createPostTrpcRoute = trpcLoggedProcedure
  .input(zCreatePostTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error('Unauthorized');
    }
    const post = await ctx.prisma.post.create({
      data: {
        title: input.title,
        description: input.description,
        text: input.text,
        author: { connect: { id: ctx.me.id } },
      },
    });

    return post;
  });
