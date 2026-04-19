import { trpcLoggedProcedure } from "../../lib/trpc";

import { zCreatePostTrpcInput } from "./input";

export const createPostTrpcRoute = trpcLoggedProcedure
  .input(zCreatePostTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }

    const communityId = input.communityId?.trim();
    let publisherType: "USER" | "COMMUNITY" = "USER";

    if (communityId) {
      const membership = await ctx.prisma.communityMember.findUnique({
        where: {
          communityId_userId: {
            communityId,
            userId: ctx.me.id,
          },
        },
        select: {
          role: true,
        },
      });

      if (!membership || !["OWNER", "MODERATOR"].includes(membership.role)) {
        throw new Error("Unauthorized");
      }

      publisherType = "COMMUNITY";
    }

    const post = await ctx.prisma.post.create({
      data: {
        title: input.title,
        description: input.description,
        text: input.text,
        images: input.images,
        author: { connect: { id: ctx.me.id } },
        publisherType,
        ...(communityId
          ? {
              publisherCommunity: {
                connect: {
                  id: communityId,
                },
              },
            }
          : {}),
      },
    });

    return post;
  });
