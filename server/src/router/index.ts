import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";

import { createTrpcRouter } from "../lib/trpc";

import { createCommentTrpcRoute } from "./createComment/createComment";
import { createCommunityTrpcRoute } from "./createCommunity/createCommunity";
import { createPostTrpcRoute } from "./createPost/createPost";
import { deleteCommentTrpcRoute } from "./deleteComment/deleteComment";
import { deleteCommunityTrpcRoute } from "./deleteCommunity/deleteCommunity";
import { deletePostTrpcRoute } from "./deletePost/deletePost";
import { getCommentsByPostTrpcRoute } from "./getCommentByPost/getCommentByPost";
import { getCommunityTrpcRoute } from "./getCommunity/getCommunity";
import { getCommunityModerationTrpcRoute } from "./getCommunityModeration/getCommunityModeration";
import { getCommunityPostsTrpcRoute } from "./getCommunityPosts/getCommunityPosts";
import { getDeletedPostsTrpcRoute } from "./getDeletedPosts/getDeletedPosts";
import { getMeTrpcRoute } from "./getMe/getMe";
import { getMyNotificationsTrpcRoute } from "./getMyNotifications/getMyNotifications";
import { getMyPostsTrpcRoute } from "./getMyPosts";
import { getMyPublishingIdentitiesTrpcRoute } from "./getMyPublishingIdentities/getMyPublishingIdentities";
import { getPostTrpcRoute } from "./getPost";
import { getPostsTrpcRoute } from "./getPosts/getPosts";
import { getRatedPostsTrpcRoute } from "./getRatedPosts/getRatedPosts";
import { getSubscribedPostsTrpcRoute } from "./getSubscribedPosts/getSubscribedPosts";
import { getUnreadNotificationsCountTrpcRoute } from "./getUnreadNotificationsCount/getUnreadNotificationsCount";
import { getUserFollowsTrpcRoute } from "./getUserFollows/getUserFollows";
import { getUserPostsTrpcRoute } from "./getUserPosts/getUserPosts";
import { getUserProfileTrpcRoute } from "./getUserProfile/getUserProfile";
import { markAllNotificationsReadTrpcRoute } from "./markAllNotificationsRead/markAllNotificationsRead";
import { setCommunityAvatarTrpcRoute } from "./setCommunityAvatar/setCommunityAvatar";
import { setCommunityModeratorTrpcRoute } from "./setCommunityModerator/setCommunityModerator";
import { setCommunitySubscriptionTrpcRoute } from "./setCommunitySubscription/setCommunitySubscription";
import { setMyAvatarTrpcRoute } from "./setMyAvatar/setMyAvatar";
import { setPostLikeTrpcRoute } from "./setPostLike/setPostLike";
import { setUserFollowTrpcRoute } from "./setUserFollow/setUserFollow";
import { signInTrpcRoute } from "./signIn/signIn";
import { signUpTrpcRoute } from "./signUp/signUp";
import { transferCommunityOwnershipTrpcRoute } from "./transferCommunityOwnership/transferCommunityOwnership";
import { undoDeletePostTrpcRoute } from "./undoDeletePost/undoDeletePost";
import { updateCommunityTrpcRoute } from "./updateCommunity/updateCommunity";
import { updatePasswordTrpcRoute } from "./updatePassword/updatePassword";
import { updatePostTrpcRoute } from "./updatePost/updatePost";
import { updateProfileTrpcRoute } from "./updateProfile/updateProfile";
import { prepareCloudinaryUploadTrpcRoute } from "./upload/prepareCloudinaryUpload/prepareCloudinaryUpload";

export const trpcRouter = createTrpcRouter({
  getPosts: getPostsTrpcRoute,
  getPost: getPostTrpcRoute,
  getMyPosts: getMyPostsTrpcRoute,
  getUserPosts: getUserPostsTrpcRoute,
  getUserProfile: getUserProfileTrpcRoute,
  getUserFollows: getUserFollowsTrpcRoute,
  getMyNotifications: getMyNotificationsTrpcRoute,
  getUnreadNotificationsCount: getUnreadNotificationsCountTrpcRoute,
  getRatedPosts: getRatedPostsTrpcRoute,
  getMyPublishingIdentities: getMyPublishingIdentitiesTrpcRoute,
  createComment: createCommentTrpcRoute,
  createCommunity: createCommunityTrpcRoute,
  createPost: createPostTrpcRoute,
  deleteCommunity: deleteCommunityTrpcRoute,
  signUp: signUpTrpcRoute,
  signIn: signInTrpcRoute,
  getMe: getMeTrpcRoute,
  getCommentsByPost: getCommentsByPostTrpcRoute,
  getCommunity: getCommunityTrpcRoute,
  getCommunityModeration: getCommunityModerationTrpcRoute,
  getCommunityPosts: getCommunityPostsTrpcRoute,
  getSubscribedPosts: getSubscribedPostsTrpcRoute,
  setCommunityAvatar: setCommunityAvatarTrpcRoute,
  setCommunityModerator: setCommunityModeratorTrpcRoute,
  transferCommunityOwnership: transferCommunityOwnershipTrpcRoute,
  updatePost: updatePostTrpcRoute,
  updateCommunity: updateCommunityTrpcRoute,
  updateProfile: updateProfileTrpcRoute,
  updatePassword: updatePasswordTrpcRoute,
  setPostLike: setPostLikeTrpcRoute,
  setCommunitySubscription: setCommunitySubscriptionTrpcRoute,
  setUserFollow: setUserFollowTrpcRoute,
  deleteComment: deleteCommentTrpcRoute,
  deletePost: deletePostTrpcRoute,
  markAllNotificationsRead: markAllNotificationsReadTrpcRoute,
  setMyAvatar: setMyAvatarTrpcRoute,
  getDeletedPosts: getDeletedPostsTrpcRoute,
  undoDeletePost: undoDeletePostTrpcRoute,
  prepareCloudinaryUpload: prepareCloudinaryUploadTrpcRoute,
});

export type TrpcRouter = typeof trpcRouter;
export type TrpcRouterInput = inferRouterInputs<TrpcRouter>;
export type TrpcRouterOutput = inferRouterOutputs<TrpcRouter>;

// console.log(
//   'procedures:',
//   Object.keys((trpcRouter as any)._def.procedures || {}),
// );
