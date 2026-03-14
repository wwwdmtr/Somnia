/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeEach } from "@jest/globals";
import { type Post, type User } from "@prisma/client";
import _ from "lodash";

import { createAppContext } from "../lib/ctx";
import { getTrpcContext } from "../lib/trpc";
import { trpcRouter } from "../router";
import { deepMap } from "../utils/deepMap";
import { getPasswordHash } from "../utils/getPasswordHash";
import { type ExpressRequest } from "../utils/types";

export const appContext = createAppContext();

afterAll(appContext.stop);

beforeEach(async () => {
  await appContext.prisma.notification.deleteMany();
  await appContext.prisma.comment.deleteMany();
  await appContext.prisma.postLike.deleteMany();
  await appContext.prisma.post.deleteMany();
  await appContext.prisma.user.deleteMany();
});

export const getTrpcCaller = (user?: User) => {
  const req = { user } as ExpressRequest;
  return trpcRouter.createCaller(getTrpcContext({ appContext, req }));
};

export const withoutNoize = (input: any): any => {
  return deepMap(input, ({ value }) => {
    if (_.isObject(value) && !_.isArray(value)) {
      return _.entries(value).reduce((acc, [objectKey, objectValue]) => {
        if ([/^id$/, /Id$/, /At$/].some((regex) => regex.test(objectKey))) {
          return acc;
        }
        return {
          ...acc,
          [objectKey]: objectValue,
        };
      }, {});
    }
    return value;
  });
};

export const createUser = async ({
  user,
  number = 1,
}: {
  user?: Partial<User>;
  number?: number;
} = {}) => {
  const safeUser = user ?? {};
  return await appContext.prisma.user.create({
    data: {
      nickname: `user${number}`,
      name: `User ${number}`,
      email: `user${number}@example.com`,
      password: getPasswordHash(safeUser.password || "1234"),
      ..._.omit(safeUser, ["password"]),
    },
  });
};

export const createPost = async ({
  post,
  author,
  number = 1,
}: {
  post?: Partial<Post>;
  author: Pick<User, "id">;
  number?: number;
}) => {
  return await appContext.prisma.post.create({
    data: {
      authorId: author.id,
      title: `Post ${number}`,
      description: `Post ${number} description`,
      text: `Post ${number} text text text text text text text text text text text text text`,
      ...(post ?? {}),
    },
  });
};

export const createPostWithAuthor = async ({
  author,
  post,
  number,
}: {
  author?: Partial<User>;
  post?: Partial<Post>;
  number?: number;
} = {}) => {
  const createdUser = await createUser({
    ...(author ? { user: author } : {}),
    ...(number !== undefined ? { number } : {}),
  });

  const createdPost = await createPost({
    ...(post ? { post } : {}),
    author: createdUser,
    ...(number !== undefined ? { number } : {}),
  });

  return {
    author: createdUser,
    post: createdPost,
  };
};

export const createPostLike = async ({
  post,
  liker,
  createdAt,
}: {
  post: Pick<Post, "id">;
  liker: Pick<User, "id">;
  createdAt?: Date;
}) => {
  return await appContext.prisma.postLike.create({
    data: {
      postId: post.id,
      userId: liker.id,
      ...(createdAt ? { createdAt } : {}),
    },
  });
};
