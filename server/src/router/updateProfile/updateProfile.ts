import { toClientMe } from '../../lib/models';
import { trpcLoggedProcedure } from '../../lib/trpc';

import { zUpadteProfileTrpcInput } from './input';

export const updateProfileTrpcRoute = trpcLoggedProcedure
  .input(zUpadteProfileTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error('UNAUTHORIZED');
    }
    if (ctx.me.nickname !== input.nickname) {
      const exUser = await ctx.prisma.user.findUnique({
        where: { nickname: input.nickname },
      });
      if (exUser) {
        throw new Error('User with this nickname already exists');
      }
    }

    const updatedMe = await ctx.prisma.user.update({
      where: {
        id: ctx.me.id,
      },
      data: input,
    });

    ctx.me = updatedMe;
    return toClientMe(updatedMe);
  });
