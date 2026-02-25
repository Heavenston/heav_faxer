import { createAuthClient } from "better-auth/svelte"
import { anonymousClient } from "better-auth/client/plugins"
import * as public_env from "$env/static/public";

export const authClient = createAuthClient({
  fetchOptions: {
  },

  baseURL: public_env.PUBLIC_BETTER_AUTH_URL,

  plugins: [
    anonymousClient(),
  ],
});
