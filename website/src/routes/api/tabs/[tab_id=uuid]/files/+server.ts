import { json, error, type RequestHandler } from "@sveltejs/kit";
import { and, eq, gt } from "drizzle-orm";
import { type } from "arktype";

import { files, tabs } from "$lib/db/schema";

export type GetTabFilesResponse = {
  files: {
    id: string,
    local_id: string | null,
    owner: string,
    tab: string,
    name: string,
    mime_type: string | null,
    size_bytes: number,
  }[],
};

function maybeToInteger(i: string | null, max: number): number | null {
  if (i == null)
    return null;

  const parsed = Number.parseInt(i);
  if (parsed <= 0)
    return 0;
  if (parsed >= max)
    return max;
  return parsed;
}

export const GET: RequestHandler = async ({ request, params, locals }) => {
  const user = locals.user;
  if (user == null)
    error(401);
  const db = locals.db_client!;

  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const count = maybeToInteger(url.searchParams.get("count"), 1_000) ?? 100;

  const found_files = await db.transaction(async tx => {
    const found_tabs = await tx.select({ owner: tabs.owner })
      .from(tabs)
      .where(eq(tabs.id, params.tab_id ?? ""));

    if (found_tabs.length === 0)
      error(404, "No such tab");
    if (found_tabs[0].owner !== user.id)
      error(403, "You do not own this tab");

    return await tx.select({
      id: files.id,
      local_id: files.local_id,
      owner: files.owner,
      tab: files.tab,
      name: files.name,
      mime_type: files.mime_type,
      size_bytes: files.size_bytes,
    })
      .from(files)
      .where(and(
        eq(files.tab, params.tab_id ?? ""),
        from != null ? gt(files.id, from) : undefined,
      ))
      .orderBy(files.id)
      .limit(count);
  }, {
    isolationLevel: "serializable",
  });

  return json({
    files: found_files,
  } satisfies GetTabFilesResponse);
};

const CreateFileRequest = type({
  files: type({
    "local_id?": "string",
    name: "string >= 1",
    "mime_type?": "string",
    size_bytes: "number.integer >= 0",
  }).array().moreThanLength(0).atMostLength(100),
});
export type CreateFileRequest = typeof CreateFileRequest.infer;

export type CreateFileResponse = {
  file_ids: string[],
};

export const POST: RequestHandler = async ({ locals, params, request }) => {
  const user = locals.user;
  if (user == null)
    error(401);

  const body = CreateFileRequest(await request.json());
  if (body instanceof type.errors)
    error(400, body.summary);

  const db = locals.db_client!;

  const inserted_ids = await db.transaction(async tx => {
    const tab = await tx.select({ owner: tabs.owner })
      .from(tabs)
      .where(eq(tabs.id, params.tab_id ?? ""))
      .limit(1);

    if (tab.length === 0)
      error(404, "This tab doesn't exist");
    if (tab[0].owner !== user.id)
      error(403, "You do not own this tab");

    const inserted_ids = await tx.insert(files)
      .values(body.files.map(file => ({
        local_id: file.local_id,

        name: file.name,
        mime_type: file.mime_type,

        owner: user.id,
        size_bytes: file.size_bytes,

        tab: params.tab_id ?? "",
      })))
      .returning({ inserted_id: files.id });

    return inserted_ids;
  }, {
    isolationLevel: "serializable",
  });

  return json({
    file_ids: inserted_ids.map(p => p.inserted_id),
  } satisfies CreateFileResponse);
};
