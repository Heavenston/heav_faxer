import { json, type RequestHandler } from "@sveltejs/kit";
import { parseMultipartRequest } from "@mjackson/multipart-parser";

export type PutFileResponse = { };

export const PUT: RequestHandler = async ({ request }) => {
  console.log("PUTPUTPUT1");
  const formData = parseMultipartRequest(request, { maxFileSize: 10 * 1024 * 1024 * 1024 });
  console.log("PUTPUTPUT2");

  for await (const data of formData) {
    console.log("PUTPUTPUT2");
    console.log(data.size);
  }

  return json({ } satisfies PutFileResponse);
};

