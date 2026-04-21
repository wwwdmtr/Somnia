import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";

import { createTrpcRouter } from "../lib/trpc";

import { cleanupPostImagesTrpcRoute } from "./cleanupPostImages/cleanupPostImages";
import { createCommentTrpcRoute } from "./createComment/createComment";
import { createCommunityTrpcRoute } from "./createCommunity/createCommunity";
import { createPostTrpcRoute } from "./createPost/createPost";
import { createReportTrpcRoute } from "./createReport/createReport";
import { deleteCommentTrpcRoute } from "./deleteComment/deleteComment";
import { deleteCommunityTrpcRoute } from "./deleteCommunity/deleteCommunity";
import { deletePostTrpcRoute } from "./deletePost/deletePost";
import { getAdminReportsTrpcRoute } from "./getAdminReports/getAdminReports";
import { getAdminUsersListTrpcRoute } from "./getAdminUsersList/getAdminUsersList";
import { getCommentsByPostTrpcRoute } from "./getCommentByPost/getCommentByPost";
import { getCommunityTrpcRoute } from "./getCommunity/getCommunity";
import { getCommunityActionLogTrpcRoute } from "./getCommunityActionLog/getCommunityActionLog";
import { getCommunityModerationTrpcRoute } from "./getCommunityModeration/getCommunityModeration";
import { getCommunityModerationListTrpcRoute } from "./getCommunityModerationList/getCommunityModerationList";
import { getCommunityPostsTrpcRoute } from "./getCommunityPosts/getCommunityPosts";
import { getDeletedPostsTrpcRoute } from "./getDeletedPosts/getDeletedPosts";
import { getMeTrpcRoute } from "./getMe/getMe";
import { getMyBlockedCommunitiesTrpcRoute } from "./getMyBlockedCommunities/getMyBlockedCommunities";
import { getMyBlockedUsersTrpcRoute } from "./getMyBlockedUsers/getMyBlockedUsers";
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
import { searchCommunitiesTrpcRoute } from "./searchCommunities/searchCommunities";
import { searchUsersTrpcRoute } from "./searchUsers/searchUsers";
import { setAdminReportStatusTrpcRoute } from "./setAdminReportStatus/setAdminReportStatus";
import { setCommunityAvatarTrpcRoute } from "./setCommunityAvatar/setCommunityAvatar";
import { setCommunityBlacklistTrpcRoute } from "./setCommunityBlacklist/setCommunityBlacklist";
import { setCommunityModeratorTrpcRoute } from "./setCommunityModerator/setCommunityModerator";
import { setCommunitySubscriptionTrpcRoute } from "./setCommunitySubscription/setCommunitySubscription";
import { setMyAvatarTrpcRoute } from "./setMyAvatar/setMyAvatar";
import { setPostLikeTrpcRoute } from "./setPostLike/setPostLike";
import { setUserAdminTrpcRoute } from "./setUserAdmin/setUserAdmin";
import { setUserContentBlockTrpcRoute } from "./setUserContentBlock/setUserContentBlock";
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
  getMyBlockedCommunities: getMyBlockedCommunitiesTrpcRoute,
  getMyBlockedUsers: getMyBlockedUsersTrpcRoute,
  getUserPosts: getUserPostsTrpcRoute,
  getUserProfile: getUserProfileTrpcRoute,
  getUserFollows: getUserFollowsTrpcRoute,
  getMyNotifications: getMyNotificationsTrpcRoute,
  getUnreadNotificationsCount: getUnreadNotificationsCountTrpcRoute,
  getRatedPosts: getRatedPostsTrpcRoute,
  getMyPublishingIdentities: getMyPublishingIdentitiesTrpcRoute,
  cleanupPostImages: cleanupPostImagesTrpcRoute,
  createComment: createCommentTrpcRoute,
  createCommunity: createCommunityTrpcRoute,
  createPost: createPostTrpcRoute,
  createReport: createReportTrpcRoute,
  deleteCommunity: deleteCommunityTrpcRoute,
  signUp: signUpTrpcRoute,
  signIn: signInTrpcRoute,
  getMe: getMeTrpcRoute,
  getCommentsByPost: getCommentsByPostTrpcRoute,
  getCommunity: getCommunityTrpcRoute,
  getCommunityActionLog: getCommunityActionLogTrpcRoute,
  getCommunityModeration: getCommunityModerationTrpcRoute,
  getCommunityModerationList: getCommunityModerationListTrpcRoute,
  getAdminReports: getAdminReportsTrpcRoute,
  getAdminUsersList: getAdminUsersListTrpcRoute,
  getCommunityPosts: getCommunityPostsTrpcRoute,
  getSubscribedPosts: getSubscribedPostsTrpcRoute,
  setCommunityAvatar: setCommunityAvatarTrpcRoute,
  setCommunityBlacklist: setCommunityBlacklistTrpcRoute,
  setCommunityModerator: setCommunityModeratorTrpcRoute,
  transferCommunityOwnership: transferCommunityOwnershipTrpcRoute,
  updatePost: updatePostTrpcRoute,
  updateCommunity: updateCommunityTrpcRoute,
  updateProfile: updateProfileTrpcRoute,
  updatePassword: updatePasswordTrpcRoute,
  setPostLike: setPostLikeTrpcRoute,
  setAdminReportStatus: setAdminReportStatusTrpcRoute,
  setUserAdmin: setUserAdminTrpcRoute,
  setCommunitySubscription: setCommunitySubscriptionTrpcRoute,
  setUserContentBlock: setUserContentBlockTrpcRoute,
  setUserFollow: setUserFollowTrpcRoute,
  searchUsers: searchUsersTrpcRoute,
  searchCommunities: searchCommunitiesTrpcRoute,
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
