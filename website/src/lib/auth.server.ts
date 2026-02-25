import { betterAuth, type BetterAuthOptions } from "better-auth";
import { anonymous } from "better-auth/plugins";
import { sveltekitCookies } from "better-auth/svelte-kit";

import * as private_env from "$env/static/private";
import * as public_env from "$env/static/public";
import { getRequestEvent } from "$app/server";
import { getDb } from "./db.server";

/**
 * We must re-create the auth for every request, because we have to re-create
 * the hyperdrive database for every request
 */
export async function createAuth(database?: BetterAuthOptions["database"]) {
  return betterAuth({
    database: database ?? await getDb(),

    emailAndPassword: {
      enabled: false,
    },

    baseURL: public_env.PUBLIC_BETTER_AUTH_URL,

    socialProviders: {
      google: {
        clientId: public_env.PUBLIC_AUTH_GOOGLE_ID,
        clientSecret: private_env.AUTH_GOOGLE_SECRET,
      },
      github: {
        clientId: public_env.PUBLIC_AUTH_GITHUB_CLIENT_ID,
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
}

export async function getAuth() {
  const event = getRequestEvent();
  if (event.locals.auth == null)
    event.locals.auth = await createAuth();
  return event.locals.auth;
}
export type Auth = Awaited<ReturnType<typeof createAuth>>;
export type Session = Auth["$Infer"]["Session"];
