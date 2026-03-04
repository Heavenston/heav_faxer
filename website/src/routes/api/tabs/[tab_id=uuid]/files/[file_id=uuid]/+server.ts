import { error, json, type RequestHandler } from "@sveltejs/kit";
import { files } from "$lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import type { R2UploadedPart } from '@cloudflare/workers-types';

export type PutFileResponse = { };

export const PUT: RequestHandler = async ({ params, locals, request, platform }) => {
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

  const bucket = platform?.env.heav_faxer_bucket!;

  const PART_SIZE = 5 * 1024 * 1024;
  const current_buffer = new Uint8Array(10 * 1024 * 1024);
  let current_buffer_offset = 0;

  const upload = await bucket.createMultipartUpload(found_file.location);
  const parts: R2UploadedPart[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done || !value) break;

      // Flush before writing if the chunk would overflow the buffer
      if (current_buffer_offset + value.byteLength > current_buffer.byteLength) {
        parts.push(await upload.uploadPart(parts.length+1, current_buffer.subarray(0, current_buffer_offset)));
        current_buffer_offset = 0;
      }

      current_buffer.set(value, current_buffer_offset);
      current_buffer_offset += value.byteLength;

      if (current_buffer_offset >= PART_SIZE) {
        parts.push(await upload.uploadPart(parts.length+1, current_buffer.subarray(0, current_buffer_offset)));
        current_buffer_offset = 0;
      }
    }

    // Flush remaining data as the final part
    if (current_buffer_offset > 0) {
      parts.push(await upload.uploadPart(parts.length+1, current_buffer.subarray(0, current_buffer_offset)));
    }

    // R2 can't complete with 0 parts, use a simple put for empty files
    if (parts.length === 0) {
      await upload.abort();
      await bucket.put(found_file.location, new Uint8Array(0));
    } else {
      await upload.complete(parts);
    }
  } catch (e) {
    await upload.abort();
    throw e;
  }

  return json({ } satisfies PutFileResponse);
};
