/* eslint-disable @typescript-eslint/no-explicit-any */

type UserContentBlockPrismaClient = any;

export const getUserBlockedUserIds = async ({
  prisma,
  userId,
  targetUserIds,
}: {
  prisma: UserContentBlockPrismaClient;
  userId: string;
  targetUserIds: string[];
}) => {
  if (targetUserIds.length === 0) {
    return new Set<string>();
  }

  const blockedUsers = await prisma.userBlockedUser.findMany({
    where: {
      userId,
      blockedUserId: {
        in: targetUserIds,
      },
    },
    select: {
      blockedUserId: true,
    },
  });

  return new Set<string>(
    blockedUsers.map((blockedUser: { blockedUserId: string }) => {
      return blockedUser.blockedUserId;
    }),
  );
};

export const getUsersWhoBlockedUserIds = async ({
  prisma,
  userId,
  targetUserIds,
}: {
  prisma: UserContentBlockPrismaClient;
  userId: string;
  targetUserIds: string[];
}) => {
  if (targetUserIds.length === 0) {
    return new Set<string>();
  }

  const blockers = await prisma.userBlockedUser.findMany({
    where: {
      blockedUserId: userId,
      userId: {
        in: targetUserIds,
      },
    },
    select: {
      userId: true,
    },
  });

  return new Set<string>(
    blockers.map((blocker: { userId: string }) => {
      return blocker.userId;
    }),
  );
};

export const hasUserBlockRelation = async ({
  prisma,
  firstUserId,
  secondUserId,
}: {
  prisma: UserContentBlockPrismaClient;
  firstUserId: string;
  secondUserId: string;
}) => {
  if (!firstUserId || !secondUserId || firstUserId === secondUserId) {
    return false;
  }

  const relation = await prisma.userBlockedUser.findFirst({
    where: {
      OR: [
        {
          userId: firstUserId,
          blockedUserId: secondUserId,
        },
        {
          userId: secondUserId,
          blockedUserId: firstUserId,
        },
      ],
    },
    select: {
      id: true,
    },
  });

  return Boolean(relation);
};

export const getUserBlockedCommunityIds = async ({
  prisma,
  userId,
  communityIds,
}: {
  prisma: UserContentBlockPrismaClient;
  userId: string;
  communityIds: string[];
}) => {
  if (communityIds.length === 0) {
    return new Set<string>();
  }

  const blockedCommunities = await prisma.userBlockedCommunity.findMany({
    where: {
      userId,
      communityId: {
        in: communityIds,
      },
    },
    select: {
      communityId: true,
    },
  });

  return new Set<string>(
    blockedCommunities.map((blockedCommunity: { communityId: string }) => {
      return blockedCommunity.communityId;
    }),
  );
};

export const isCommunityBlockedByUser = async ({
  prisma,
  userId,
  communityId,
}: {
  prisma: UserContentBlockPrismaClient;
  userId: string;
  communityId: string;
}) => {
  if (!userId || !communityId) {
    return false;
  }

  const block = await prisma.userBlockedCommunity.findUnique({
    where: {
      userId_communityId: {
        userId,
        communityId,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(block);
};
