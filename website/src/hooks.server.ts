import { getAuth } from "$lib/auth.server";
import { building } from '$app/environment'

import { svelteKitHandler } from "better-auth/svelte-kit";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
  const auth = await getAuth();

  const session = await auth.api.getSession({
    headers: event.request.headers,
  });

  if (session == null) {
    const result = await auth.api.signInAnonymous();
    if (result != null)
      event.locals.user = result.user as typeof auth.$Infer.Session.user;
  }
  else {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }


  return svelteKitHandler({ event, resolve, auth, building });
}
