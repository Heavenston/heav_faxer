import type { auth } from "$lib/auth";
import { authClient } from "./auth-client";

export function useUser(initialValue: typeof auth.$Infer.Session.user | null) {
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
        user = (result.data?.user ?? null) as typeof auth.$Infer.Session.user;
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

