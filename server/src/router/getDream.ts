import { z } from 'zod';

import { trpc } from '../lib/trpc';

export const getDreamTrpcRoute = trpc.procedure
  .input(
    z.object({
      id: z.string(),
    })
  )
  .query(async ({ ctx, input }) => {
    const dream = await ctx.prisma.dream.findUnique({
      where: { id: input.id },
    });
    return { dream };
  });
