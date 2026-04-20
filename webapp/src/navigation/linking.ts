import { LinkingOptions, ParamListBase } from "@react-navigation/native";

import ScreenName from "../constants/ScreenName";
import TabName from "../constants/TabName";
import { env } from "../lib/env";

export const linking = {
  prefixes: [env.WEBAPP_URL],
  config: {
    screens: {
      [ScreenName.Onboarding]: "",
      [ScreenName.SignIn]: "sign-in",
      [ScreenName.SignUp]: "sign-up",
      [ScreenName.RootTabs]: {
        screens: {
          [TabName.FeedTab]: {
            screens: {
              [ScreenName.Feed]: "feed",
              [ScreenName.Notifications]: "feed/notifications",
              [ScreenName.Profile]: "feed/profile/:userId",
              [ScreenName.Community]: "feed/community/:id",
              [ScreenName.UpdateCommunity]: "feed/community/:id/edit",
              [ScreenName.UserConnections]: "feed/profile/:userId/:type",
              [ScreenName.Post]: "feed/post/:id",
              [ScreenName.EditPost]: "feed/post/:id/edit",
            },
          },
          [TabName.SearchTab]: {
            screens: {
              [ScreenName.Search]: "search",
              [ScreenName.Profile]: "search/profile/:userId",
              [ScreenName.Community]: "search/community/:id",
              [ScreenName.UpdateCommunity]: "search/community/:id/edit",
              [ScreenName.UserConnections]: "search/profile/:userId/:type",
              [ScreenName.Post]: "search/post/:id",
              [ScreenName.EditPost]: "search/post/:id/edit",
            },
          },
          [TabName.AddPostTab]: {
            screens: {
              [ScreenName.AddPost]: "create",
            },
          },
          [TabName.ProfileTab]: {
            screens: {
              [ScreenName.Profile]: "profile",
              [ScreenName.UpdateProfile]: "profile/edit",
              [ScreenName.SignOut]: "sign-out",
              [ScreenName.Community]: "profile/community/:id",
              [ScreenName.UpdateCommunity]: "profile/community/:id/edit",
              [ScreenName.UserConnections]: "profile/:userId/:type",
              [ScreenName.Post]: "profile/post/:id",
              [ScreenName.EditPost]: "profile/post/:id/edit",
            },
          },
        },
      },
      [ScreenName.AdminStack]: {
        path: "admin",
        screens: {
          [ScreenName.AdminHome]: "",
          [ScreenName.DeletedPosts]: "deleted-posts",
          [ScreenName.Profile]: "profile/:userId",
          [ScreenName.Community]: "community/:id",
          [ScreenName.UpdateCommunity]: "community/:id/edit",
          [ScreenName.UserConnections]: "profile/:userId/:type",
          [ScreenName.Post]: "post/:id",
          [ScreenName.EditPost]: "post/:id/edit",
        },
      },
    },
  },
} as LinkingOptions<ParamListBase>;
