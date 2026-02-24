import { betterAuth } from "better-auth";
import { anonymous } from "better-auth/plugins";
import Database from "better-sqlite3";
import { sveltekitCookies } from "better-auth/svelte-kit";

import * as private_env from "$env/static/private";
import { getRequestEvent } from "$app/server";

export const auth = betterAuth({
  database: new Database("./sqlite.db"),

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    google: {
      clientId: private_env.AUTH_GOOGLE_ID,
      clientSecret: private_env.AUTH_GOOGLE_SECRET,
    },
    github: {
      clientId: private_env.AUTH_GITHUB_CLIENT_ID,
      clientSecret: private_env.AUTH_GITHUB_CLIENT_SECRET,
    },
  },

  plugins: [
    anonymous({
      onLinkAccount: async (_data) => { /* TODO */ },
    }),
    sveltekitCookies(getRequestEvent),
  ],
});
