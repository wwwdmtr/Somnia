import { trpc } from '../../lib/trpc';

import { zCreateDreamTrpcInput } from './input';

export const createDreamTrpcRoute = trpc.procedure
  .input(zCreateDreamTrpcInput)
  .mutation(async ({ ctx, input }) => {
    const dream = await ctx.prisma.dream.create({
      data: {
        title: input.title,
        description: input.description,
        text: input.text,
      },
    });

    return dream;
  });
