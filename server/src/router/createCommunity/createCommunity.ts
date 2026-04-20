import { Prisma } from "@prisma/client";

import { ExpectedError } from "../../lib/error";
import { trpcLoggedProcedure } from "../../lib/trpc";
import { isAvatarOwnedByUser } from "../../utils/cloudinaryPublicId";

import { zCreateCommunityTrpcInput } from "./input";

export const createCommunityTrpcRoute = trpcLoggedProcedure
  .input(zCreateCommunityTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    if (
      input.avatar &&
      !isAvatarOwnedByUser({
        avatarPublicId: input.avatar,
        userId: ctx.me.id,
      })
    ) {
      throw new ExpectedError("Некорректный идентификатор аватарки");
    }

    try {
      const community = await ctx.prisma.community.create({
        data: {
          name: input.name,
          description: input.description,
          avatar: input.avatar ?? null,
          ownerId: ctx.me.id,
          members: {
            create: {
              userId: ctx.me.id,
              role: "OWNER",
            },
          },
          subscriptions: {
            create: {
              userId: ctx.me.id,
            },
          },
        },
        select: {
          id: true,
          name: true,
          description: true,
          avatar: true,
          createdAt: true,
        },
      });

      return { community };
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
