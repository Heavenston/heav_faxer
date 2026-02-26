import { json, error, type RequestHandler } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

import { tabs } from "$lib/db/schema";

export type ListTabsResponse = {
  tabs: {
    id: string,
    name: string,
  }[],
};

export const GET: RequestHandler = async ({ locals }) => {
  const user = locals.user;
  if (user == null)
    error(401);
  const db = locals.db_client!;
  const found_tabs = await db.select()
    .from(tabs)
    .where(eq(tabs.owner, user.id));

  return json({
    tabs: found_tabs.map(tab => ({
      id: tab.id,
      name: tab.name,
    })),
  } satisfies ListTabsResponse);
};

