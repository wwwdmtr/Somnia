import { trpcLoggedProcedure } from '../../lib/trpc';

import { zMarkAllNotificationsReadTrpcInput } from './input';

export const markAllNotificationsReadTrpcRoute = trpcLoggedProcedure
  .input(zMarkAllNotificationsReadTrpcInput)
  .mutation(async ({ ctx }) => {
    if (!ctx.me) {
      throw new Error('Unauthorized');
    }

    const result = await ctx.prisma.notification.updateMany({
      where: {
        recipientId: ctx.me.id,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return { updatedCount: result.count };
  });
