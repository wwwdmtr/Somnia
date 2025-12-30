import { trpc } from "../../lib/trpc";

import { zCreatePostTrpcInput } from "./input";

export const createPostTrpcRoute = trpc.procedure
  .input(zCreatePostTrpcInput)
  .mutation(async ({ ctx, input }) => {
    if (!ctx.me) {
      throw new Error("Unauthorized");
    }
    const post = await ctx.prisma.post.create({
      data: {
        title: input.title,
        description: input.description,
        text: input.text,
        author: { connect: { id: ctx.me.id } },
      },
    });

    return post;
  });
