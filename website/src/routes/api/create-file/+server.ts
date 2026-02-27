import { json, error, type RequestHandler } from "@sveltejs/kit";
import { type } from "arktype";
import { eq } from "drizzle-orm";

import { tabs, files } from "$lib/db/schema";

const CreateFileRequest = type({
  tab_id: "string.uuid",
  name: "string >= 1",
  "mime_type?": "string",
  size_bytes: "number.integer >= 0",
});
export type CreateFileRequest = typeof CreateFileRequest.infer;

export type CreateFileResponse = {
  id: string,
};

export const POST: RequestHandler = async ({ platform, locals, request }) => {
  const user = locals.user;
  if (user == null)
    error(401);

  const body = CreateFileRequest(await request.json());
  if (body instanceof type.errors)
    error(400, body.summary);

  const db = locals.db_client!;

  const inserted_id = await db.transaction(async tx => {
    const tab = await tx.select({ owner: tabs.owner })
      .from(tabs)
      .where(eq(tabs.id, body.tab_id))
      .limit(1);

    if (tab.length === 0) {
      error(404, "This tab doesn't exist");
    }

    if (tab[0].owner !== user.id) {
      error(403, "You do not own this tab");
    }

    const [{ inserted_id }] = await tx.insert(files)
      .values({
        name: body.name,
        mime_type: body.mime_type,

        owner: user.id,
        size_bytes: body.size_bytes,

        tab: body.tab_id,
      })
      .returning({ inserted_id: files.id });

    return inserted_id;
  }, {
    isolationLevel: "serializable",
  });

  console.log(platform?.env);

  return json({
    id: inserted_id,
  } satisfies CreateFileResponse);
};
