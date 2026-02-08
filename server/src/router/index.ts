import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";

import { trpc } from "../lib/trpc";

import { createCommentTrpcRoute } from "./createComment/createComment";
import { createPostTrpcRoute } from "./createPost/createPost";
import { deleteCommentTrpcRoute } from "./deleteComment/deleteComment";
import { deletePostTrpcRoute } from "./deletePost/deletePost";
import { getCommentsByPostTrpcRoute } from "./getCommentByPost/getCommentByPost";
import { getMeTrpcRoute } from "./getMe/getMe";
import { getMyPostsTrpcRoute } from "./getMyPosts";
import { getPostTrpcRoute } from "./getPost";
import { getPostsTrpcRoute } from "./getPosts/getPosts";
import { getRatedPostsTrpcRoute } from "./getRatedPosts/getRatedPosts";
import { setPostLikeTrpcRoute } from "./setPostLike/setPostLike";
import { signInTrpcRoute } from "./signIn/signIn";
import { signUpTrpcRoute } from "./signUp/signUp";
import { updatePasswordTrpcRoute } from "./updatePassword/updatePassword";
import { updatePostTrpcRoute } from "./updatePost/updatePost";
import { updateProfileTrpcRoute } from "./updateProfile/updateProfile";

export const trpcRouter = trpc.router({
  getPosts: getPostsTrpcRoute,
  getPost: getPostTrpcRoute,
  getMyPosts: getMyPostsTrpcRoute,
  getRatedPosts: getRatedPostsTrpcRoute,
  createComment: createCommentTrpcRoute,
  createPost: createPostTrpcRoute,
  signUp: signUpTrpcRoute,
  signIn: signInTrpcRoute,
  getMe: getMeTrpcRoute,
  getCommentsByPost: getCommentsByPostTrpcRoute,
  updatePost: updatePostTrpcRoute,
  updateProfile: updateProfileTrpcRoute,
  updatePassword: updatePasswordTrpcRoute,
  setPostLike: setPostLikeTrpcRoute,
  deleteComment: deleteCommentTrpcRoute,
  deletePost: deletePostTrpcRoute,
});

export type TrpcRouter = typeof trpcRouter;
export type TrpcRouterInput = inferRouterInputs<TrpcRouter>;
export type TrpcRouterOutput = inferRouterOutputs<TrpcRouter>;

// console.log(
//   'procedures:',
//   Object.keys((trpcRouter as any)._def.procedures || {}),
// );
