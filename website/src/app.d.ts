// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { Auth } from "$lib/auth.server";
import type { Hyperdrive } from '@cloudflare/workers-types';
import type { DbClient } from "$lib/db.server";

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			auth?: Auth,
			session?: typeof Auth.$Infer.Session.session,
			user?: typeof Auth.$Infer.Session.user,
			db_client?: DbClient,
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				HYPERDRIVE: Hyperdrive;
			};
		}
	}
}

export {};
