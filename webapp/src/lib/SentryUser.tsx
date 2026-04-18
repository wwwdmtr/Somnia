import { useEffect } from "react";

import { useMe } from "./ctx";
import { sentrySetUser } from "./sentrySDK";

export const SentryUser = () => {
  const me = useMe();

  useEffect(() => {
    if (me) {
      sentrySetUser({
        email: me.email,
        id: me.id,
        username: me.nickname,
      });
      return;
    }

    sentrySetUser(null);
  }, [me]);

  return null;
};
