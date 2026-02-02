import _ from "lodash";

import { trpc } from "../../lib/trpc";

import { zGetRatedPostsTrpcInput } from "./input";

export const getRatedPostsTrpcRoute = trpc.procedure
  .input(zGetRatedPostsTrpcInput)
  .query(async ({ ctx, input }) => {
    const userId = ctx.me?.id;

    let dateFrom: Date | undefined;

    if (input.period) {
      const now = new Date();

      switch (input.period) {
        case "day":
          dateFrom = new Date(now.setDate(now.getDate() - 1));
          break;
        case "week":
          dateFrom = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          dateFrom = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "all":
        default:
          dateFrom = undefined;
          break;
      }
    }

    const rawSearch = input.search?.trim();
    const normalizedSearch = rawSearch
      ? rawSearch.replace(/\s+/g, " & ")
      : undefined;

    const shouldUseFts =
      !!rawSearch && rawSearch.length >= 3 && !/^\d+$/.test(rawSearch);

    const where = {
      ...(dateFrom ? { createdAt: { gte: dateFrom } } : {}),

      ...(rawSearch
        ? {
            OR: [
              { title: { contains: rawSearch, mode: "insensitive" as const } },
              {
                description: {
                  contains: rawSearch,
                  mode: "insensitive" as const,
                },
              },
              { text: { contains: rawSearch, mode: "insensitive" as const } },

              ...(shouldUseFts
                ? ([
                    { title: { search: normalizedSearch! } },
                    { description: { search: normalizedSearch! } },
                    { text: { search: normalizedSearch! } },
                  ] as const)
                : []),
            ],
          }
        : {}),
    };

    const rawPosts = await ctx.prisma.post.findMany({
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { seq: input.cursor }, skip: 1 } : {}),

      where,

      orderBy: {
        postLikes: {
          _count: "desc",
        },
      },

      select: {
        id: true,
        seq: true,
        title: true,
        description: true,
        text: true,
        createdAt: true,

        author: {
          select: { nickname: true },
        },

        _count: {
          select: {
            postLikes: true,
            comments: {
              where: { deletedAt: null },
            },
          },
        },

        ...(userId
          ? {
              postLikes: {
                where: { userId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    let nextCursor: number | null = null;
    if (rawPosts.length > input.limit) {
      rawPosts.pop();
      nextCursor = rawPosts[rawPosts.length - 1]?.seq ?? null;
    }

    const posts = rawPosts.map((post) => ({
      ..._.omit(post, ["_count", "postLikes"]),
      likesCount: post._count.postLikes,
      commentsCount: post._count.comments,
      isLikedByMe: userId ? post.postLikes.length > 0 : false,
    }));

    return { posts, nextCursor };
  });
