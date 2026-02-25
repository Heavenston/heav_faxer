import { getRequestEvent } from '$app/server';
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

export async function createDb(connectionString?: string) {
  const sql = new Pool({
    connectionString: connectionString ?? getRequestEvent().platform?.env.HYPERDRIVE.connectionString,
    min: 1,
    max: 8,
  });

  return drizzle(sql);
}

export async function getDb() {
  const event = getRequestEvent();
  if (event.locals.db_client == null)
    event.locals.db_client = await createDb();
  return event.locals.db_client;
}

export type DbClient = Awaited<ReturnType<typeof createDb>>;
