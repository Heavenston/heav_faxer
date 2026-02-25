/**
 * This is a version of the better-auth config that works with the cli
 * Not actually used during the server's runtime
 */

import 'dotenv/config';
import { createAuth } from "./auth.server";
import { createDb } from "./db.server";

export const auth = await createAuth(await createDb(process.env.DATABASE_URL));
