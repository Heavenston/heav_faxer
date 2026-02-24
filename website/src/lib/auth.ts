import { betterAuth } from "better-auth";
import { anonymous } from "better-auth/plugins";
import Database from "better-sqlite3";
import { sveltekitCookies } from "better-auth/svelte-kit";

import { AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET } from "$env/static/private";
import { getRequestEvent } from "$app/server";

export const auth = betterAuth({
  database: new Database("./sqlite.db"),

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    google: {
      clientId: AUTH_GOOGLE_ID,
      clientSecret: AUTH_GOOGLE_SECRET,
    },
  },

  plugins: [anonymous(), sveltekitCookies(getRequestEvent)],
});
