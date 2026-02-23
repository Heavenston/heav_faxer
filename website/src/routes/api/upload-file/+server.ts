import { json, error, type RequestHandler } from "@sveltejs/kit";
import { type } from "arktype";

export const UploadfileRequest = type({
  name: "string",
});
export type UploadfileRequest = typeof UploadfileRequest.infer;

export type UploadfileResponse = { };

export const POST: RequestHandler = async ({ request }) => {
  const body = UploadfileRequest(await request.json());

  if (body instanceof type.errors) {
    error(400, body.summary);
  }

  return json({
      
  } satisfies UploadfileResponse);
};
