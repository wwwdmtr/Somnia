import { trpc } from "../../lib/trpc";

import { zGetMyNotificationsTrpcInput } from "./input";

export const getMyNotificationsTrpcRoute = trpc.procedure
  .input(zGetMyNotificationsTrpcInput)
  .query(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const rawNotifications = await ctx.prisma.notification.findMany({
      where: {
        recipientId: ctx.me.id,
      },
      take: input.limit + 1,
      ...(input.cursor && {
        cursor: { id: input.cursor },
        skip: 1,
      }),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        type: true,
        createdAt: true,
        readAt: true,
        postId: true,
        commentId: true,
        actor: {
          select: {
            id: true,
            nickname: true,
            name: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            parentId: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    if (rawNotifications.length > input.limit) {
      rawNotifications.pop();
      nextCursor = rawNotifications[rawNotifications.length - 1]?.id ?? null;
    }

    return {
      notifications: rawNotifications,
      nextCursor,
    };
  });
