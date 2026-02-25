import type { Session } from "$lib/auth.server";
import { authClient } from "./auth-client";

export function useUser(initialValue: Session["user"] | null) {
  let user = $state(initialValue);

  return {
    user: () => user,
    signOut: async () => {
      const result = await authClient.signOut();
      if (result.error != null) {
        console.error(result.error);
        return false;
      }
      else {
        user = null;
        return true;
      }
    },
    signInAnonymous: async () => {
      const result = await authClient.signIn.anonymous();
      if (result.error != null) {
        console.error(result.error);
        return false;
      }
      else {
        user = (result.data?.user ?? null) as Session["user"];
        return true;
      }
    },
    signInGoogle: async () => {
      await authClient.signIn.social({
        provider: "google",
      });
    },
    signInGithub: async () => {
      await authClient.signIn.social({
        provider: "github",
      });
    },
  };
}

