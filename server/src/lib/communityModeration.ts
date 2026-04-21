/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Prisma } from "@prisma/client";

type CommunityModerationPrismaClient = any;

export type CommunityBlacklistDuration = "PERMANENT" | "DAY" | "WEEK" | "MONTH";

export const isCommunityManagerRole = (
  role: "OWNER" | "MODERATOR" | "MEMBER" | null | undefined,
): role is "OWNER" | "MODERATOR" => role === "OWNER" || role === "MODERATOR";

export const getCommunityMembershipRole = async ({
  prisma,
  communityId,
  userId,
}: {
  prisma: CommunityModerationPrismaClient;
  communityId: string;
  userId: string;
}) => {
  const membership = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: {
        communityId,
        userId,
      },
    },
    select: {
      role: true,
    },
  });

  return membership?.role ?? null;
};

const ACTIVE_BLACKLIST_OR = (now: Date) =>
  [
    {
      expiresAt: null,
    },
    {
      expiresAt: {
        gt: now,
      },
    },
  ] as const;

export const getActiveCommunityBlacklistEntry = async ({
  prisma,
  communityId,
  userId,
  now = new Date(),
}: {
  prisma: CommunityModerationPrismaClient;
  communityId: string;
  userId: string;
  now?: Date;
}) =>
  prisma.communityBlacklist.findFirst({
    where: {
      communityId,
      userId,
      OR: ACTIVE_BLACKLIST_OR(now),
    },
    select: {
      id: true,
      expiresAt: true,
    },
  });

export const getBlockedCommunityIds = async ({
  prisma,
  userId,
  communityIds,
  now = new Date(),
}: {
  prisma: CommunityModerationPrismaClient;
  userId: string;
  communityIds: string[];
  now?: Date;
}) => {
  if (communityIds.length === 0) {
    return new Set<string>();
  }

  const entries = await prisma.communityBlacklist.findMany({
    where: {
      userId,
      communityId: {
        in: communityIds,
      },
      OR: ACTIVE_BLACKLIST_OR(now),
    },
    select: {
      communityId: true,
    },
  });

  return new Set<string>(
    entries.map((entry: { communityId: string }) => entry.communityId),
  );
};

export const calculateBlacklistExpiresAt = (
  duration: CommunityBlacklistDuration,
) => {
  if (duration === "PERMANENT") {
    return null;
  }

  const expiresAt = new Date();
  if (duration === "DAY") {
    expiresAt.setHours(expiresAt.getHours() + 24);
    return expiresAt;
  }

  if (duration === "WEEK") {
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }

  expiresAt.setMonth(expiresAt.getMonth() + 1);
  return expiresAt;
};

export const createCommunityActionLog = async ({
  prisma,
  communityId,
  actionType,
  actorUserId,
  targetUserId,
  postId,
  details,
}: {
  prisma: CommunityModerationPrismaClient;
  communityId: string;
  actionType:
    | "BLACKLIST_ADDED"
    | "BLACKLIST_REMOVED"
    | "MODERATOR_ASSIGNED"
    | "MODERATOR_REVOKED"
    | "OWNERSHIP_TRANSFERRED"
    | "POST_PUBLISHED"
    | "POST_UPDATED"
    | "POST_DELETED"
    | "COMMUNITY_UPDATED"
    | "COMMUNITY_AVATAR_UPDATED";
  actorUserId?: string | null;
  targetUserId?: string | null;
  postId?: string | null;
  details?: Prisma.InputJsonValue;
}) =>
  prisma.communityActionLog.create({
    data: {
      communityId,
      actionType,
      ...(actorUserId ? { actorUserId } : {}),
      ...(targetUserId ? { targetUserId } : {}),
      ...(postId ? { postId } : {}),
      ...(details ? { details } : {}),
    },
  });

export const notifyExpiredCommunityBlacklistEntriesForUser = async ({
  prisma,
  userId,
}: {
  prisma: CommunityModerationPrismaClient;
  userId: string;
}) => {
  const now = new Date();

  const expiredEntries = await prisma.communityBlacklist.findMany({
    where: {
      userId,
      expiresAt: {
        lte: now,
      },
      unblockedNotifiedAt: null,
    },
    select: {
      id: true,
      communityId: true,
      createdByUserId: true,
      restoreSubscriptionOnUnblock: true,
    },
  });

  if (expiredEntries.length === 0) {
    return;
  }

  await prisma.$transaction(async (tx: any) => {
    await Promise.all(
      expiredEntries.map(
        async (entry: {
          id: string;
          communityId: string;
          createdByUserId: string;
          restoreSubscriptionOnUnblock: boolean;
        }) => {
          const updated = await tx.communityBlacklist.updateMany({
            where: {
              id: entry.id,
              unblockedNotifiedAt: null,
            },
            data: {
              unblockedNotifiedAt: now,
            },
          });

          if (updated.count === 0) {
            return;
          }

          await Promise.all([
            entry.restoreSubscriptionOnUnblock
              ? tx.communitySubscription.upsert({
                  where: {
                    communityId_userId: {
                      communityId: entry.communityId,
                      userId,
                    },
                  },
                  create: {
                    communityId: entry.communityId,
                    userId,
                  },
                  update: {},
                })
              : Promise.resolve(),
            tx.notification.create({
              data: {
                type: "COMMUNITY_UNBLACKLISTED",
                recipientId: userId,
                actorId: entry.createdByUserId,
                communityId: entry.communityId,
                details: {
                  reason: "EXPIRED",
                },
              },
            }),
            createCommunityActionLog({
              prisma: tx,
              communityId: entry.communityId,
              actionType: "BLACKLIST_REMOVED",
              actorUserId: null,
              targetUserId: userId,
              details: {
                reason: "EXPIRED",
              },
            }),
          ]);
        },
      ),
    );
  });
};
