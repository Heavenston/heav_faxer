import { json, error, type RequestHandler } from "@sveltejs/kit";
import { type } from "arktype";

const PutFileRequest = type({
  files: type({
    "local_id?": "string",
    name: "string >= 1",
    "mime_type?": "string",
    size_bytes: "number.integer >= 0",
  }).array().moreThanLength(0).atMostLength(100),
});
export type PutFileRequest = typeof PutFileRequest.infer;

export type PutFileResponse = {
};

export const PUT: RequestHandler = async ({ locals, request }) => {
  const user = locals.user;
  if (user == null)
    error(401);

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File))
    error(400, "Invalid file given");
  const stream = file.stream();
  const reader = stream.getReader();

  let done = false;
  while (!done) {
    const result = await reader.read();
    done = result.done;

    if (!result.value) continue;
    const buffer = result.value;
    console.log(buffer.byteLength);
  }

  return json({ } satisfies PutFileResponse);
};

