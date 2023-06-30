export const API_PATH = "https://faxer.heav.fr/api";
// export const API_PATH = "http://localhost:8080";

export type UploadLinkErrorReason =
    "aborted" | "ratelimited" | "conflict" | "invalid" | "other";
export type UploadLinkResult =
    | {
          success: true;
          shortened_to: string;
      }
    | {
          success: false;
          reason: UploadLinkErrorReason;
          message?: string;
    };

export async function upload_link(
    key: string,
    target: string,
    signal?: AbortSignal
): Promise<UploadLinkResult> {
    let rsp: Response;
    try {
        rsp = await fetch(`${API_PATH}/link/${encodeURIComponent(key)}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                target,
            }),
            signal,
        });
    }
    catch (e) {
        if (e instanceof TypeError) {
            return { success: false, reason: "other", message: e.message };
        }
        throw e;
    }

    if (rsp.status == 200)
        return {
            success: true,
            shortened_to: `https://hfax.fr/l/${key}`,
        };

    if (signal?.aborted) return { success: false, reason: "aborted" };

    if (rsp.status == 429) return { success: false, reason: "ratelimited" };

    if (rsp.status == 409) return { success: false, reason: "conflict" };

    if (rsp.status == 400) return { success: false, reason: "invalid" };

    return { success: false, reason: "other" };
}

export function create_random_link(): string {
    const alphabet = (
        "abcdefghijklmnopqrstuvwxyz0123456789" +
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ          "
    ).replace(/ /g, "");
    const length = 5;

    let r = "";
    for (let i = 0; i < length; i++)
        r += alphabet[Math.floor(Math.random() * alphabet.length)];
    return r;
}
