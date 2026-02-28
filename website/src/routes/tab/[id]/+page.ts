import { error, redirect } from "@sveltejs/kit";
import type { GetTabFilesResponse } from "../../api/tabs/[id]/files/+server";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch }) => {
  const tab_id = params.id;
  const response = await fetch(`/api/tabs/${tab_id}/files`)
  if (response.status === 404)
    error(404);
  if (response.status === 401 || response.status === 403)
    redirect(307, "/");
  if (!response.ok)
    throw new Error(await response.text());
  const { files }: GetTabFilesResponse = await response.json();

  return {
    files,
  };
};
