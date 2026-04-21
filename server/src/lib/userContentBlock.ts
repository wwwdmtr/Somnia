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
