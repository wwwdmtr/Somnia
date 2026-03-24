import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zGetUnreadNotificationsCountTrpcInput } from "./input";

export const getUnreadNotificationsCountTrpcRoute = trpcLoggedProcedure
  .input(zGetUnreadNotificationsCountTrpcInput)
  .query(async ({ ctx }) => {
    if (!ctx.me) {
      throw new ExpectedError("Unauthorized");
    }

    const unreadCount = await ctx.prisma.notification.count({
      where: {
        recipientId: ctx.me.id,
        readAt: null,
      },
    });

    return { unreadCount };
  });
