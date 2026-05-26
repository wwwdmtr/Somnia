import { type inferRouterInputs, type inferRouterOutputs } from "@trpc/server";

import { createTrpcRouter } from "../lib/trpc";

import { getAdminCommunityVerificationRequestsTrpcRoute } from "./admin/getAdminCommunityVerificationRequests/getAdminCommunityVerificationRequests";
import { getAdminReportsTrpcRoute } from "./admin/getAdminReports/getAdminReports";
import { getAdminUsersListTrpcRoute } from "./admin/getAdminUsersList/getAdminUsersList";
import { setAdminCommunityVerificationRequestStatusTrpcRoute } from "./admin/setAdminCommunityVerificationRequestStatus/setAdminCommunityVerificationRequestStatus";
import { setAdminReportStatusTrpcRoute } from "./admin/setAdminReportStatus/setAdminReportStatus";
import { setUserAdminTrpcRoute } from "./admin/setUserAdmin/setUserAdmin";
import { signInTrpcRoute } from "./auth/signIn/signIn";
import { signUpTrpcRoute } from "./auth/signUp/signUp";
import { createCommentTrpcRoute } from "./comments/createComment/createComment";
import { deleteCommentTrpcRoute } from "./comments/deleteComment/deleteComment";
import { getCommentsByPostTrpcRoute } from "./comments/getCommentByPost/getCommentByPost";
import { createCommunityTrpcRoute } from "./communities/createCommunity/createCommunity";
import { createCommunityVerificationRequestTrpcRoute } from "./communities/createCommunityVerificationRequest/createCommunityVerificationRequest";
import { deleteCommunityTrpcRoute } from "./communities/deleteCommunity/deleteCommunity";
import { getCommunityTrpcRoute } from "./communities/getCommunity/getCommunity";
import { getCommunityPostsTrpcRoute } from "./communities/getCommunityPosts/getCommunityPosts";
import { getMyPublishingIdentitiesTrpcRoute } from "./communities/getMyPublishingIdentities/getMyPublishingIdentities";
import { setCommunityAvatarTrpcRoute } from "./communities/setCommunityAvatar/setCommunityAvatar";
import { setCommunitySubscriptionTrpcRoute } from "./communities/setCommunitySubscription/setCommunitySubscription";
import { updateCommunityTrpcRoute } from "./communities/updateCommunity/updateCommunity";
import { getCommunityActionLogTrpcRoute } from "./moderation/getCommunityActionLog/getCommunityActionLog";
import { getCommunityModerationTrpcRoute } from "./moderation/getCommunityModeration/getCommunityModeration";
import { getCommunityModerationListTrpcRoute } from "./moderation/getCommunityModerationList/getCommunityModerationList";
import { setCommunityBlacklistTrpcRoute } from "./moderation/setCommunityBlacklist/setCommunityBlacklist";
import { setCommunityModeratorTrpcRoute } from "./moderation/setCommunityModerator/setCommunityModerator";
import { transferCommunityOwnershipTrpcRoute } from "./moderation/transferCommunityOwnership/transferCommunityOwnership";
import { getMyNotificationsTrpcRoute } from "./notifications/getMyNotifications/getMyNotifications";
import { getUnreadNotificationsCountTrpcRoute } from "./notifications/getUnreadNotificationsCount/getUnreadNotificationsCount";
import { markAllNotificationsReadTrpcRoute } from "./notifications/markAllNotificationsRead/markAllNotificationsRead";
import { cleanupPostImagesTrpcRoute } from "./posts/cleanupPostImages/cleanupPostImages";
import { createPostTrpcRoute } from "./posts/createPost/createPost";
import { deletePostTrpcRoute } from "./posts/deletePost/deletePost";
import { getDeletedPostsTrpcRoute } from "./posts/getDeletedPosts/getDeletedPosts";
import { getMyPostsTrpcRoute } from "./posts/getMyPosts";
import { getPostTrpcRoute } from "./posts/getPost";
import { getPostsTrpcRoute } from "./posts/getPosts/getPosts";
import { getRatedPostsTrpcRoute } from "./posts/getRatedPosts/getRatedPosts";
import { getSubscribedPostsTrpcRoute } from "./posts/getSubscribedPosts/getSubscribedPosts";
import { setPostLikeTrpcRoute } from "./posts/setPostLike/setPostLike";
import { undoDeletePostTrpcRoute } from "./posts/undoDeletePost/undoDeletePost";
import { updatePostTrpcRoute } from "./posts/updatePost/updatePost";
import { createReportTrpcRoute } from "./reports/createReport/createReport";
import { searchCommunitiesTrpcRoute } from "./search/searchCommunities/searchCommunities";
import { searchUsersTrpcRoute } from "./search/searchUsers/searchUsers";
import { prepareCloudinaryUploadTrpcRoute } from "./upload/prepareCloudinaryUpload/prepareCloudinaryUpload";
import { getMeTrpcRoute } from "./users/getMe/getMe";
import { getMyBlockedCommunitiesTrpcRoute } from "./users/getMyBlockedCommunities/getMyBlockedCommunities";
import { getMyBlockedUsersTrpcRoute } from "./users/getMyBlockedUsers/getMyBlockedUsers";
import { getUserFollowsTrpcRoute } from "./users/getUserFollows/getUserFollows";
import { getUserPostsTrpcRoute } from "./users/getUserPosts/getUserPosts";
import { getUserProfileTrpcRoute } from "./users/getUserProfile/getUserProfile";
import { setMyAvatarTrpcRoute } from "./users/setMyAvatar/setMyAvatar";
import { setUserContentBlockTrpcRoute } from "./users/setUserContentBlock/setUserContentBlock";
import { setUserFollowTrpcRoute } from "./users/setUserFollow/setUserFollow";
import { updatePasswordTrpcRoute } from "./users/updatePassword/updatePassword";
import { updateProfileTrpcRoute } from "./users/updateProfile/updateProfile";

export const trpcRouter = createTrpcRouter({
  signUp: signUpTrpcRoute,
  signIn: signInTrpcRoute,

  getMe: getMeTrpcRoute,
  getUserProfile: getUserProfileTrpcRoute,
  getUserPosts: getUserPostsTrpcRoute,
  getUserFollows: getUserFollowsTrpcRoute,
  getMyBlockedCommunities: getMyBlockedCommunitiesTrpcRoute,
  getMyBlockedUsers: getMyBlockedUsersTrpcRoute,
  updateProfile: updateProfileTrpcRoute,
  updatePassword: updatePasswordTrpcRoute,
  setMyAvatar: setMyAvatarTrpcRoute,
  setUserContentBlock: setUserContentBlockTrpcRoute,
  setUserFollow: setUserFollowTrpcRoute,

  getPosts: getPostsTrpcRoute,
  getPost: getPostTrpcRoute,
  getMyPosts: getMyPostsTrpcRoute,
  getRatedPosts: getRatedPostsTrpcRoute,
  getSubscribedPosts: getSubscribedPostsTrpcRoute,
  getDeletedPosts: getDeletedPostsTrpcRoute,
  createPost: createPostTrpcRoute,
  updatePost: updatePostTrpcRoute,
  deletePost: deletePostTrpcRoute,
  undoDeletePost: undoDeletePostTrpcRoute,
  setPostLike: setPostLikeTrpcRoute,
  cleanupPostImages: cleanupPostImagesTrpcRoute,

  getCommentsByPost: getCommentsByPostTrpcRoute,
  createComment: createCommentTrpcRoute,
  deleteComment: deleteCommentTrpcRoute,

  getCommunity: getCommunityTrpcRoute,
  getCommunityPosts: getCommunityPostsTrpcRoute,
  getMyPublishingIdentities: getMyPublishingIdentitiesTrpcRoute,
  createCommunity: createCommunityTrpcRoute,
  createCommunityVerificationRequest:
    createCommunityVerificationRequestTrpcRoute,
  updateCommunity: updateCommunityTrpcRoute,
  deleteCommunity: deleteCommunityTrpcRoute,
  setCommunityAvatar: setCommunityAvatarTrpcRoute,
  setCommunitySubscription: setCommunitySubscriptionTrpcRoute,

  getCommunityActionLog: getCommunityActionLogTrpcRoute,
  getCommunityModeration: getCommunityModerationTrpcRoute,
  getCommunityModerationList: getCommunityModerationListTrpcRoute,
  setCommunityBlacklist: setCommunityBlacklistTrpcRoute,
  setCommunityModerator: setCommunityModeratorTrpcRoute,
  transferCommunityOwnership: transferCommunityOwnershipTrpcRoute,

  getMyNotifications: getMyNotificationsTrpcRoute,
  getUnreadNotificationsCount: getUnreadNotificationsCountTrpcRoute,
  markAllNotificationsRead: markAllNotificationsReadTrpcRoute,

  createReport: createReportTrpcRoute,

  getAdminReports: getAdminReportsTrpcRoute,
  getAdminCommunityVerificationRequests:
    getAdminCommunityVerificationRequestsTrpcRoute,
  getAdminUsersList: getAdminUsersListTrpcRoute,
  setAdminReportStatus: setAdminReportStatusTrpcRoute,
  setAdminCommunityVerificationRequestStatus:
    setAdminCommunityVerificationRequestStatusTrpcRoute,
  setUserAdmin: setUserAdminTrpcRoute,

  searchUsers: searchUsersTrpcRoute,
  searchCommunities: searchCommunitiesTrpcRoute,

  prepareCloudinaryUpload: prepareCloudinaryUploadTrpcRoute,
});

export type TrpcRouter = typeof trpcRouter;
export type TrpcRouterInput = inferRouterInputs<TrpcRouter>;
export type TrpcRouterOutput = inferRouterOutputs<TrpcRouter>;

// console.log(
//   'procedures:',
//   Object.keys((trpcRouter as any)._def.procedures || {}),
// );
