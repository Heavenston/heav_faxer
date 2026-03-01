import { error, json, type RequestHandler } from "@sveltejs/kit";
import { files } from "$lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export type PutFileResponse = { };

export const PUT: RequestHandler = async ({ params, locals, request }) => {
  const user = locals.user;
  if (user == null)
    error(401);
  const db = locals.db_client!;

  const type = request.headers.get("Content-Type");
  if (type !== "application/octet-stream") {
    error(400, "Expected content-type application/octet-stream");
  }

  const length = parseInt(request.headers.get("Content-Length") ?? "");
  if (isNaN(length) || length < 0) /* I guess this is impossible at this stage */
    error(400, "Invalid Content-Length");

  const body = request.body;
  if (!body)
    error(400, "No body");
  const reader = body.getReader();

  const found_file = await (async function location_choser() {
    const found_files = await db.select({
      owner: files.owner,
      size_bytes: files.size_bytes,
      location: files.location,
    })
      .from(files)
      .where(and(
        eq(files.id, params.file_id ?? ""),
        eq(files.tab, params.tab_id ?? ""),
      ));
    if (found_files.length === 0)
      error(404, "Unknown File");
    const found_file = found_files[0];

    if (found_file.owner !== user.id)
      error(403, "You are not the owner of this file");
    if (found_file.location != null)
      return { ...found_file, location: found_file.location };

    const location = `/files/${crypto.randomUUID()}`;
    
    const update_result = await db.update(files)
      .set({ location })
      .where(and(
        eq(files.id, params.file_id ?? ""),
        isNull(files.location),
      ));

    // If we lost the race condition we try again
    if (update_result.rowCount === 0) {
      return await location_choser();
    }

    return { ...found_file, location };
  })();

  let count = 0;
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    count += 1;
    size += value.byteLength;

    if (size > 100_000_000) {
      await new Promise(cb => setTimeout(cb, 100));
      size = 0;
    }
  }

  console.log(`${size} bytes in ${count} chuncks`);

  return json({ } satisfies PutFileResponse);
};

