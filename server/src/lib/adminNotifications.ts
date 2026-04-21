/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NotificationType, type Prisma } from "@prisma/client";

type AdminNotificationsPrismaClient = any;

export const notifyAdmins = async ({
  prisma,
  actorUserId,
  type,
  postId,
  communityId,
  details,
}: {
  prisma: AdminNotificationsPrismaClient;
  actorUserId: string;
  type: NotificationType;
  postId?: string;
  communityId?: string;
  details?: Prisma.InputJsonValue;
}) => {
  const admins = await prisma.user.findMany({
    where: {
      id: {
        not: actorUserId,
      },
      OR: [
        {
          permissions: {
            has: "ALL" as const,
          },
        },
        {
          permissions: {
            has: "SUPER_ADMIN" as const,
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  if (admins.length === 0) {
    return;
  }

  await prisma.notification.createMany({
    data: admins.map((admin: { id: string }) => ({
      type,
      recipientId: admin.id,
      actorId: actorUserId,
      ...(postId ? { postId } : {}),
      ...(communityId ? { communityId } : {}),
      ...(details ? { details } : {}),
    })),
  });
};
