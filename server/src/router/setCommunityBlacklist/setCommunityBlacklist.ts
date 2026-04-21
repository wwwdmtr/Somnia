import {
  calculateBlacklistExpiresAt,
  createCommunityActionLog,
  getCommunityMembershipRole,
  isCommunityManagerRole,
} from "../../lib/communityModeration";
import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zSetCommunityBlacklistTrpcInput } from "./input";

export const setCommunityBlacklistTrpcRoute = trpcLoggedProcedure
  .input(zSetCommunityBlacklistTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const community = await ctx.prisma.community.findUnique({
      where: {
        id: input.communityId,
      },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!community) {
      throw new ExpectedError("Сообщество не найдено");
    }

    const myRole = await getCommunityMembershipRole({
      prisma: ctx.prisma,
      communityId: input.communityId,
      userId: ctx.me.id,
    });

    if (community.ownerId !== ctx.me.id && !isCommunityManagerRole(myRole)) {
      throw new Error("Unauthorized");
    }

    if (input.userId === ctx.me.id) {
      throw new ExpectedError("Нельзя добавить себя в черный список");
    }

    if (input.userId === community.ownerId) {
      throw new ExpectedError("Нельзя заблокировать владельца сообщества");
    }

    const [targetMembership, existingEntry, subscription] = await Promise.all([
      ctx.prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId: input.communityId,
            userId: input.userId,
          },
        },
        select: {
          role: true,
        },
      }),
      ctx.prisma.communityBlacklist.findUnique({
        where: {
          communityId_userId: {
            communityId: input.communityId,
            userId: input.userId,
          },
        },
        select: {
          id: true,
          expiresAt: true,
          restoreSubscriptionOnUnblock: true,
        },
      }),
      ctx.prisma.communitySubscription.findUnique({
        where: {
          communityId_userId: {
            communityId: input.communityId,
            userId: input.userId,
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (isCommunityManagerRole(targetMembership?.role ?? null)) {
      throw new ExpectedError("Нельзя добавить владельца или модератора в ЧС");
    }

    if (input.isBlocked) {
      const now = new Date();
      const isExistingActiveEntry =
        !!existingEntry &&
        (!existingEntry.expiresAt || existingEntry.expiresAt > now);

      if (
        !subscription &&
        !isExistingActiveEntry &&
        !existingEntry?.restoreSubscriptionOnUnblock
      ) {
        throw new ExpectedError("Пользователь должен быть подписчиком");
      }

      const duration = input.duration ?? "PERMANENT";
      const expiresAt = calculateBlacklistExpiresAt(duration);
      const durationLabel =
        duration === "DAY"
          ? "24 часа"
          : duration === "WEEK"
            ? "1 неделю"
            : duration === "MONTH"
              ? "1 месяц"
              : "навсегда";

      await ctx.prisma.$transaction(async (tx) => {
        const shouldRestoreSubscriptionOnUnblock =
          !!subscription ||
          !!existingEntry?.restoreSubscriptionOnUnblock ||
          false;

        await tx.communityBlacklist.upsert({
          where: {
            communityId_userId: {
              communityId: input.communityId,
              userId: input.userId,
            },
          },
          create: {
            communityId: input.communityId,
            userId: input.userId,
            createdByUserId: ctx.me!.id,
            expiresAt,
            restoreSubscriptionOnUnblock: shouldRestoreSubscriptionOnUnblock,
          },
          update: {
            createdByUserId: ctx.me!.id,
            expiresAt,
            unblockedNotifiedAt: null,
            restoreSubscriptionOnUnblock: shouldRestoreSubscriptionOnUnblock,
          },
        });

        await tx.communitySubscription.deleteMany({
          where: {
            communityId: input.communityId,
            userId: input.userId,
          },
        });

        await tx.notification.create({
          data: {
            type: "COMMUNITY_BLACKLISTED",
            recipientId: input.userId,
            actorId: ctx.me!.id,
            communityId: input.communityId,
            details: {
              duration,
              durationLabel,
              expiresAt: expiresAt ? expiresAt.toISOString() : null,
            },
          },
        });

        await createCommunityActionLog({
          prisma: tx,
          communityId: input.communityId,
          actionType: "BLACKLIST_ADDED",
          actorUserId: ctx.me!.id,
          targetUserId: input.userId,
          details: {
            duration,
            expiresAt: expiresAt ? expiresAt.toISOString() : null,
          },
        });
      });

      return {
        communityId: input.communityId,
        userId: input.userId,
        isBlocked: true,
        expiresAt,
      };
    }

    if (existingEntry) {
      await ctx.prisma.$transaction(async (tx) => {
        if (existingEntry.restoreSubscriptionOnUnblock) {
          await tx.communitySubscription.upsert({
            where: {
              communityId_userId: {
                communityId: input.communityId,
                userId: input.userId,
              },
            },
            create: {
              communityId: input.communityId,
              userId: input.userId,
            },
            update: {},
          });
        }

        await tx.communityBlacklist.delete({
          where: {
            communityId_userId: {
              communityId: input.communityId,
              userId: input.userId,
            },
          },
        });

        await tx.notification.create({
          data: {
            type: "COMMUNITY_UNBLACKLISTED",
            recipientId: input.userId,
            actorId: ctx.me!.id,
            communityId: input.communityId,
            details: {
              reason: "MANUAL",
            },
          },
        });

        await createCommunityActionLog({
          prisma: tx,
          communityId: input.communityId,
          actionType: "BLACKLIST_REMOVED",
          actorUserId: ctx.me!.id,
          targetUserId: input.userId,
          details: {
            reason: "MANUAL",
          },
        });
      });
    }

    return {
      communityId: input.communityId,
      userId: input.userId,
      isBlocked: false,
      expiresAt: null,
    };
  });
