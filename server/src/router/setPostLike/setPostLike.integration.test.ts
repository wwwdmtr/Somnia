import { describe, expect, it } from "@jest/globals";

import {
  appContext,
  createPostWithAuthor,
  createUser,
  getTrpcCaller,
} from "../../test/integration";

describe("setPostLike", () => {
  it("create like", async () => {
    const { post } = await createPostWithAuthor({ number: 1 });
    const liker = await createUser({ number: 2 });
    const trpcCallerForLiker = getTrpcCaller(liker);

    const result = await trpcCallerForLiker.setPostLike({
      postId: post.id,
      isLikedByMe: true,
    });

    expect(result).toMatchObject({
      post: {
        isLikedByMe: true,
        likesCount: 1,
      },
    });

    const postLikes = await appContext.prisma.postLike.findMany();
    expect(postLikes).toHaveLength(1);
    expect(postLikes[0]).toMatchObject({
      postId: post.id,
      userId: liker.id,
    });
  });

  it("remove like", async () => {
    const { post } = await createPostWithAuthor({ number: 1 });
    const liker = await createUser({ number: 2 });
    const trpcCallerForLiker = getTrpcCaller(liker);

    const result1 = await trpcCallerForLiker.setPostLike({
      postId: post.id,
      isLikedByMe: true,
    });

    expect(result1).toMatchObject({
      post: {
        isLikedByMe: true,
        likesCount: 1,
      },
    });

    const result2 = await trpcCallerForLiker.setPostLike({
      postId: post.id,
      isLikedByMe: false,
    });

    expect(result2).toMatchObject({
      post: {
        isLikedByMe: false,
        likesCount: 0,
      },
    });

    const postLikes = await appContext.prisma.postLike.findMany();
    expect(postLikes).toHaveLength(0);
  });

  it("create notification for post author when another user likes post", async () => {
    const { post, author } = await createPostWithAuthor({ number: 10 });
    const liker = await createUser({ number: 11 });
    const trpcCallerForLiker = getTrpcCaller(liker);

    await trpcCallerForLiker.setPostLike({
      postId: post.id,
      isLikedByMe: true,
    });

    const notifications = await appContext.prisma.notification.findMany();
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({
      type: "POST_LIKED",
      recipientId: author.id,
      actorId: liker.id,
      postId: post.id,
    });
  });

  it("does not create notification when author likes own post", async () => {
    const { post, author } = await createPostWithAuthor({ number: 20 });
    const trpcCallerForAuthor = getTrpcCaller(author);

    await trpcCallerForAuthor.setPostLike({
      postId: post.id,
      isLikedByMe: true,
    });

    const notifications = await appContext.prisma.notification.findMany();
    expect(notifications).toHaveLength(0);
  });

  it("remove like also removes related notification", async () => {
    const { post, author } = await createPostWithAuthor({ number: 30 });
    const liker = await createUser({ number: 31 });
    const trpcCallerForLiker = getTrpcCaller(liker);

    await trpcCallerForLiker.setPostLike({
      postId: post.id,
      isLikedByMe: true,
    });

    const notificationsAfterLike =
      await appContext.prisma.notification.findMany();
    expect(notificationsAfterLike).toHaveLength(1);
    expect(notificationsAfterLike[0]).toMatchObject({
      type: "POST_LIKED",
      recipientId: author.id,
      actorId: liker.id,
      postId: post.id,
    });

    await trpcCallerForLiker.setPostLike({
      postId: post.id,
      isLikedByMe: false,
    });

    const notificationsAfterUnlike =
      await appContext.prisma.notification.findMany();
    expect(notificationsAfterUnlike).toHaveLength(0);
  });
});
