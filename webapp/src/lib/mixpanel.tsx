import mixpanel from "mixpanel-browser";
import { useEffect } from "react";

import { useMe } from "./ctx";
import { env } from "./env";

import type { ClientMe } from "@somnia/shared/src/lib/models";

if (env.MIXPANEL_API_KEY) {
  mixpanel.init(env.MIXPANEL_API_KEY, {
    api_host: env.MIXPANEL_API_HOST,
    api_transport: "XHR",
    batch_requests: false,
    debug: env.NODE_ENV === "development",
  });
}

const whenEnabled = <T,>(fn: T): T => {
  return env.MIXPANEL_API_KEY ? fn : ((() => {}) as T);
};

export const mixpanelIdentify = whenEnabled((userId: string) => {
  mixpanel.identify(userId);
});

export const mixpanelAlias = whenEnabled((userId: string) => {
  mixpanel.alias(userId);
});

export const mixpanelReset = whenEnabled(() => {
  mixpanel.reset();
});

export const mixpanelPeopleSet = whenEnabled((me: NonNullable<ClientMe>) => {
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

  if (Object.keys(props).length > 0) {
    mixpanel.people.set(props);
  }
});

export const mixpanelTrackSignUp = whenEnabled(() => {
  mixpanel.track("Sign Up");
});

export const mixpanelTrackSignIn = whenEnabled(() => {
  mixpanel.track("Sign In");
});

export const mixpanelTrackSignOut = whenEnabled(() => {
  mixpanel.track("Sign Out");
});

export const mixpanelTrackPostLike = whenEnabled(
  (post: { id: string; isLikedByMe: boolean }) => {
    mixpanel.track("Post Like/Unlike", {
      action: post.isLikedByMe ? "like" : "unlike",
      postId: post.id,
    });
  },
);

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
