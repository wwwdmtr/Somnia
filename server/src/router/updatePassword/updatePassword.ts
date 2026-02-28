import { trpcLoggedProcedure } from '../../lib/trpc';
import { getPasswordHash } from '../../utils/getPasswordHash';

import { zUpdatePasswordTrpcInput } from './input';

export const updatePasswordTrpcRoute = trpcLoggedProcedure
  .input(zUpdatePasswordTrpcInput)
  .mutation(async ({ input, ctx }) => {
    if (!ctx.me) {
      throw new Error('UNAUTHORIZED');
    }
    if (ctx.me.password !== getPasswordHash(input.currentPassword)) {
      throw new Error('Неверный текущий пароль');
    }
    const updatedMe = await ctx.prisma.user.update({
      where: { id: ctx.me.id },
      data: { password: getPasswordHash(input.newPassword) },
    });
    ctx.me = updatedMe;
    return true;
  });
