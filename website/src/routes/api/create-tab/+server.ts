import { json, error, type RequestHandler } from "@sveltejs/kit";
import { type } from "arktype";

import { tabs } from "$lib/db/schema";

const CreateTabRequest = type({
  name: "1 <= string <= 32",
});
export type CreateTabRequest = typeof CreateTabRequest.infer;

export type CreateTabResponse = {
  id: string,
};

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (user == null)
    error(401);

  const body = CreateTabRequest(await request.json());
  if (body instanceof type.errors) {
    error(400, body.summary);
  }

  const db = locals.db_client!;
  const [{ inserted_id }] = await db.insert(tabs)
    .values({
      name: body.name,
      owner: user.id,
    })
    .returning({ inserted_id: tabs.id });
    
  return json({
    id: inserted_id,
  } satisfies CreateTabResponse);
};
