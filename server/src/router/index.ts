import { type inferRouterInputs, type inferRouterOutputs } from '@trpc/server';

import { createTrpcRouter } from '../lib/trpc';

import { createCommentTrpcRoute } from './createComment/createComment';
import { createPostTrpcRoute } from './createPost/createPost';
import { deleteCommentTrpcRoute } from './deleteComment/deleteComment';
import { deletePostTrpcRoute } from './deletePost/deletePost';
import { getCommentsByPostTrpcRoute } from './getCommentByPost/getCommentByPost';
import { getDeletedPostsTrpcRoute } from './getDeletedPosts/getDeletedPosts';
import { getMeTrpcRoute } from './getMe/getMe';
import { getMyNotificationsTrpcRoute } from './getMyNotifications/getMyNotifications';
import { getMyPostsTrpcRoute } from './getMyPosts';
import { getPostTrpcRoute } from './getPost';
import { getPostsTrpcRoute } from './getPosts/getPosts';
import { getRatedPostsTrpcRoute } from './getRatedPosts/getRatedPosts';
import { getUnreadNotificationsCountTrpcRoute } from './getUnreadNotificationsCount/getUnreadNotificationsCount';
import { markAllNotificationsReadTrpcRoute } from './markAllNotificationsRead/markAllNotificationsRead';
import { setPostLikeTrpcRoute } from './setPostLike/setPostLike';
import { signInTrpcRoute } from './signIn/signIn';
import { signUpTrpcRoute } from './signUp/signUp';
import { undoDeletePostTrpcRoute } from './undoDeletePost/undoDeletePost';
import { updatePasswordTrpcRoute } from './updatePassword/updatePassword';
import { updatePostTrpcRoute } from './updatePost/updatePost';
import { updateProfileTrpcRoute } from './updateProfile/updateProfile';

export const trpcRouter = createTrpcRouter({
  getPosts: getPostsTrpcRoute,
  getPost: getPostTrpcRoute,
  getMyPosts: getMyPostsTrpcRoute,
  getMyNotifications: getMyNotificationsTrpcRoute,
  getUnreadNotificationsCount: getUnreadNotificationsCountTrpcRoute,
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
  markAllNotificationsRead: markAllNotificationsReadTrpcRoute,
  getDeletedPosts: getDeletedPostsTrpcRoute,
  undoDeletePost: undoDeletePostTrpcRoute,
});

export type TrpcRouter = typeof trpcRouter;
export type TrpcRouterInput = inferRouterInputs<TrpcRouter>;
export type TrpcRouterOutput = inferRouterOutputs<TrpcRouter>;

// console.log(
//   'procedures:',
//   Object.keys((trpcRouter as any)._def.procedures || {}),
// );
