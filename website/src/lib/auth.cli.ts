/**
 * This is a version of the better-auth config that works with the cli
 * Not actually used during the server's runtime
 */

import { createAuth } from "./auth.server";
import { Pool } from "pg";

export const auth = await createAuth(new Pool({
  connectionString: process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE,
}));
