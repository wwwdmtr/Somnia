import { trpcLoggedProcedure } from '../../lib/trpc';
import { getPasswordHash } from '../../utils/getPasswordHash';
import { signJWT } from '../../utils/signJWT';

import { zSignInTrpcInput } from './input';

export const signInTrpcRoute = trpcLoggedProcedure
  .input(zSignInTrpcInput)
  .mutation(async ({ input, ctx }) => {
    const user = await ctx.prisma.user.findFirst({
      where: {
        nickname: input.nickname,
        password: getPasswordHash(input.password),
      },
    });
    if (!user) {
      throw new Error('Неверный никнейм или пароль');
    }

    const token = signJWT(user.id);

    return { token };
  });
