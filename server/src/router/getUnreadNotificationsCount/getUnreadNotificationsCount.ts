import { trpc } from "../../lib/trpc";

import { zGetUnreadNotificationsCountTrpcInput } from "./input";

export const getUnreadNotificationsCountTrpcRoute = trpc.procedure
  .input(zGetUnreadNotificationsCountTrpcInput)
  .query(async ({ ctx }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const unreadCount = await ctx.prisma.notification.count({
      where: {
        recipientId: ctx.me.id,
        readAt: null,
      },
    });

    return { unreadCount };
  });
