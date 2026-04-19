import { describe, expect, it } from "@jest/globals";

import { appContext, createUser, getTrpcCaller } from "../../test/integration";

describe("setUserFollow", () => {
  it("creates follow notification for target user", async () => {
    const follower = await createUser({ number: 101 });
    const target = await createUser({ number: 102 });

    const trpcCallerForFollower = getTrpcCaller(follower);

    await trpcCallerForFollower.setUserFollow({
      userId: target.id,
      isFollowing: true,
    });

    const notifications = await appContext.prisma.notification.findMany();
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      type: "USER_FOLLOWED",
      recipientId: target.id,
      actorId: follower.id,
      postId: null,
      commentId: null,
    });
  });

  it("does not create duplicate follow notifications when already following", async () => {
    const follower = await createUser({ number: 111 });
    const target = await createUser({ number: 112 });

    const trpcCallerForFollower = getTrpcCaller(follower);

    await trpcCallerForFollower.setUserFollow({
      userId: target.id,
      isFollowing: true,
    });

    await trpcCallerForFollower.setUserFollow({
      userId: target.id,
      isFollowing: true,
    });

    const notifications = await appContext.prisma.notification.findMany({
      where: {
        type: "USER_FOLLOWED",
        recipientId: target.id,
        actorId: follower.id,
      },
    });

    expect(notifications).toHaveLength(1);
  });
});
