import { trpcLoggedProcedure } from "../../lib/trpc";
import {
  destroyPostImages,
  getUnreferencedPostImagePublicIds,
  isPostImageOwnedByUser,
} from "../../utils/postImages";

import { zCleanupPostImagesTrpcInput } from "./input";

export const cleanupPostImagesTrpcRoute = trpcLoggedProcedure
  .input(zCleanupPostImagesTrpcInput)
  .mutation(async ({ ctx, input }) => {
    const me = ctx.me;
    if (!me) {
      throw new Error("Unauthorized");
    }

    const uniqueOwnedImagePublicIds = Array.from(
      new Set(
        input.imagePublicIds.filter((imagePublicId) =>
          isPostImageOwnedByUser({
            imagePublicId,
            userId: me.id,
          }),
        ),
      ),
    );

    const orphanedImagePublicIds = await getUnreferencedPostImagePublicIds({
      prisma: ctx.prisma,
      imagePublicIds: uniqueOwnedImagePublicIds,
    });

    await destroyPostImages({
      imagePublicIds: orphanedImagePublicIds,
      logContext: {
        actorUserId: me.id,
        action: "cleanupPostImages",
      },
    });

    return {
      deletedCount: orphanedImagePublicIds.length,
      skippedCount: input.imagePublicIds.length - orphanedImagePublicIds.length,
    };
  });
