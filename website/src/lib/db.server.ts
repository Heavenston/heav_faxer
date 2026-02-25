import { getRequestEvent } from '$app/server';
import { Pool } from "pg";
// import { drizzle } from "drizzle-orm/node-postgres";
// import * as private_env from "$env/static/private";

async function createDb() {
  const event = getRequestEvent();
  const sql = new Pool({
    connectionString: event.platform?.env.HYPERDRIVE.connectionString,
    min: 1,
    max: 8,
  });

  // await sql.connect();

  return sql;
}

export async function getDb() {
  const event = getRequestEvent();
  if (event.locals.db_client == null)
    event.locals.db_client = await createDb();
  return event.locals.db_client;
}

export type DbClient = Awaited<ReturnType<typeof createDb>>;
