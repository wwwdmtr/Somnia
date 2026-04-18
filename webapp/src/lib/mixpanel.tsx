import { useEffect } from "react";
import { Platform } from "react-native";

import { useMe } from "./ctx";
import { env } from "./env";

import type { ClientMe } from "@somnia/shared/src/lib/models";
import type mixpanelType from "mixpanel-browser";

type MixpanelClient = typeof mixpanelType;

const isMixpanelEnabled =
  Platform.OS === "web" && Boolean(env.MIXPANEL_API_KEY);

let mixpanelClientPromise: Promise<MixpanelClient | null> | null = null;
let isMixpanelInitialized = false;

const getMixpanelClient = async (): Promise<MixpanelClient | null> => {
  if (!isMixpanelEnabled) {
    return null;
  }

  if (!mixpanelClientPromise) {
    mixpanelClientPromise = import("mixpanel-browser")
      .then((mixpanelModule) => {
        const mixpanelClient = mixpanelModule.default;

        if (!isMixpanelInitialized) {
          mixpanelClient.init(env.MIXPANEL_API_KEY, {
            api_host: env.MIXPANEL_API_HOST,
            api_transport: "XHR",
            batch_requests: false,
            debug: env.NODE_ENV === "development",
          });
          isMixpanelInitialized = true;
        }

        return mixpanelClient;
      })
      .catch(() => null);
  }

  return mixpanelClientPromise;
};

const withMixpanel = (callback: (mixpanelClient: MixpanelClient) => void) => {
  if (!isMixpanelEnabled) {
    return;
  }

  void getMixpanelClient().then((mixpanelClient) => {
    if (!mixpanelClient) {
      return;
    }

    callback(mixpanelClient);
  });
};

export const mixpanelIdentify = (userId: string) => {
  withMixpanel((mixpanelClient) => {
    mixpanelClient.identify(userId);
  });
};

export const mixpanelAlias = (userId: string) => {
  withMixpanel((mixpanelClient) => {
    mixpanelClient.alias(userId);
  });
};

export const mixpanelReset = () => {
  withMixpanel((mixpanelClient) => {
    mixpanelClient.reset();
  });
};

export const mixpanelPeopleSet = (me: NonNullable<ClientMe>) => {
  const props: Record<string, string> = {};

  if (me.email) {
    props.$email = me.email;
  }
  if (me.nickname) {
    props.nickname = me.nickname;
  }
  if (me.name) {
    props.$name = me.name;
  }

  if (Object.keys(props).length === 0) {
    return;
  }

  withMixpanel((mixpanelClient) => {
    mixpanelClient.people.set(props);
  });
};

export const mixpanelTrackSignUp = () => {
  withMixpanel((mixpanelClient) => {
    mixpanelClient.track("Sign Up");
  });
};

export const mixpanelTrackSignIn = () => {
  withMixpanel((mixpanelClient) => {
    mixpanelClient.track("Sign In");
  });
};

export const mixpanelTrackSignOut = () => {
  withMixpanel((mixpanelClient) => {
    mixpanelClient.track("Sign Out");
  });
};

export const mixpanelTrackPostLike = (post: {
  id: string;
  isLikedByMe: boolean;
}) => {
  withMixpanel((mixpanelClient) => {
    mixpanelClient.track("Post Like/Unlike", {
      action: post.isLikedByMe ? "like" : "unlike",
      postId: post.id,
    });
  });
};

export const MixpanelUser = () => {
  const me = useMe();
  const userId = me?.id;
  const email = me?.email;
  const nickname = me?.nickname;
  const name = me?.name;

  useEffect(() => {
    if (userId) {
      mixpanelAlias(userId);
      mixpanelIdentify(userId);
    } else {
      mixpanelReset();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      mixpanelPeopleSet({
        id: userId,
        email: email ?? null,
        nickname: nickname ?? "",
        name: name ?? null,
      });
    }
  }, [userId, email, nickname, name]);

  return null;
};
