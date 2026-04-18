import { mixpanelTrackPostLike } from "./mixpanel";
import { trpc } from "./trpc";

type PostLikeState = {
  id: string;
  isLikedByMe: boolean;
  likesCount: number;
};

type SetPostLikeInput = {
  isLikedByMe: boolean;
  postId: string;
};

type CacheController<TData> = {
  applyOptimistic: (
    old: TData | undefined,
    variables: SetPostLikeInput,
  ) => TData | undefined;
  applyServer: (
    old: TData | undefined,
    data: PostLikeState,
  ) => TData | undefined;
  cancel: () => Promise<void>;
  getData: () => TData | undefined;
  setData: (updater: (old: TData | undefined) => TData | undefined) => void;
};

type MutationContext<TData> = {
  previousData: TData | undefined;
};

type LikeablePost = {
  id: string;
  isLikedByMe: boolean;
  likesCount: number;
};

export const applyOptimisticLikeToPosts = <TPost extends LikeablePost>(
  posts: TPost[],
  variables: SetPostLikeInput,
) => {
  return posts.map((post) => {
    if (post.id !== variables.postId) {
      return post;
    }

    return {
      ...post,
      isLikedByMe: variables.isLikedByMe,
      likesCount: variables.isLikedByMe
        ? post.likesCount + 1
        : post.likesCount - 1,
    };
  });
};

export const applyServerLikeToPosts = <TPost extends LikeablePost>(
  posts: TPost[],
  data: PostLikeState,
) => {
  return posts.map((post) => {
    if (post.id !== data.id) {
      return post;
    }

    return {
      ...post,
      isLikedByMe: data.isLikedByMe,
      likesCount: data.likesCount,
    };
  });
};

export const usePostLikeMutation = <TData>(cache: CacheController<TData>) => {
  return trpc.setPostLike.useMutation({
    onMutate: async (variables) => {
      await cache.cancel();
      const previousData = cache.getData();

      if (!variables) {
        return { previousData } satisfies MutationContext<TData>;
      }

      cache.setData((old) => cache.applyOptimistic(old, variables));

      return { previousData } satisfies MutationContext<TData>;
    },
    onError: (_err, _variables, context) => {
      if (!context) {
        return;
      }

      cache.setData(() => context.previousData);
    },
    onSuccess: (data) => {
      cache.setData((old) => cache.applyServer(old, data.post));
      mixpanelTrackPostLike(data.post);
    },
  });
};
