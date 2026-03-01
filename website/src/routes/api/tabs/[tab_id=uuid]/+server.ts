import { json, error, type RequestHandler } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import { tabs } from "$lib/db/schema";

export type DeleteTabsResponse = { };

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const user = locals.user;
  if (user == null)
    error(401);
  const db = locals.db_client!;

  const result = await db.delete(tabs)
    .where(and(
      eq(tabs.id, params.tab_id ?? ""),
      eq(tabs.owner, user.id),
    ));

  if (result.rowCount === 0)
    error(404);

  return json({ } satisfies DeleteTabsResponse);
};
