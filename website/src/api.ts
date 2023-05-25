export const API_PATH = "https://faxer.heav.fr/api";
//export const API_PATH = "http://localhost:8080";

export type UploadLinkResult =
    | {
          success: true;
          shortened_to: string;
      }
    | {
          success: false;
          reason: "aborted" | "ratelimited" | "conflict" | "other";
      };

export async function upload_link(
    key: string,
    target: string,
    signal?: AbortSignal
): Promise<UploadLinkResult> {
    const rsp = await fetch(`${API_PATH}/link/${encodeURIComponent(key)}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            target,
        }),
        signal,
    });

    if (rsp.status == 200)
        return {
            success: true,
            shortened_to: `https://hfax.fr/l/${key}`,
        };

    if (signal?.aborted) return { success: false, reason: "aborted" };

    if (rsp.status == 429) return { success: false, reason: "ratelimited" };

    if (rsp.status == 409) return { success: false, reason: "conflict" };

    return { success: false, reason: "other" };
}

export function create_random_link(): string {
    const alphabet = (
        "abcdefghijklmnopqrstuvwxyz0123456789" +
        "ABCDE GH    MN P R                  "
    ).replace(/ /g, "");
    const length = 5;

    let r = "";
    for (let i = 0; i < length; i++)
        r += alphabet[Math.floor(Math.random() * alphabet.length)];
    return r;
}
