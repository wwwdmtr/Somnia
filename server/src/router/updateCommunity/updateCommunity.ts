import { Prisma } from "@prisma/client";

import { createCommunityActionLog } from "../../lib/communityModeration";
import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";

import { zUpdateCommunityTrpcInput } from "./input";

export const updateCommunityTrpcRoute = trpcLoggedProcedure
  .input(zUpdateCommunityTrpcInput)
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
        name: true,
        description: true,
      },
    });

    if (!community) {
      throw new ExpectedError("Сообщество не найдено");
    }

    if (community.ownerId !== ctx.me.id) {
      throw new Error("Unauthorized");
    }

    try {
      const updatedCommunity = await ctx.prisma.community.update({
        where: {
          id: input.communityId,
        },
        data: {
          name: input.name,
          description: input.description,
        },
        select: {
          id: true,
          name: true,
          description: true,
          avatar: true,
        },
      });

      if (
        community.name !== updatedCommunity.name ||
        community.description !== updatedCommunity.description
      ) {
        await createCommunityActionLog({
          prisma: ctx.prisma,
          communityId: input.communityId,
          actionType: "COMMUNITY_UPDATED",
          actorUserId: ctx.me.id,
        });
      }

      return {
        community: updatedCommunity,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ExpectedError("Сообщество с таким именем уже существует");
      }

      throw error;
    }
  });
