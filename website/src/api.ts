export const API_PATH = import.meta.env.VITE_API_BASE_URL;
export const LINKS_BASE_URL = import.meta.env.VITE_LINKS_BASE_URL;
export const FILES_BASE_URL = import.meta.env.VITE_FILES_BASE_URL;

export type UploadLinkResult =
    | {
          success: true;
          shortened_to: string;
      }
    | {
          success: false;
          error: string;
          message?: string;
          retry_in?: number;
      };

export async function upload_link(
    key: string,
    target: string,
    password?: string,
    signal?: AbortSignal
): Promise<UploadLinkResult> {
    let rsp: Response;
    try {
        rsp = await fetch(`${API_PATH}link/${encodeURIComponent(key)}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                target,
                write_password: password,
            }),
            signal,
        });
    } catch (e) {
        if (e instanceof TypeError) {
            return { success: false, error: "other", message: e.message };
        }
        throw e;
    }
    const body = await rsp.json();

    if (rsp.status == 200)
        return {
            success: true,
            shortened_to: `${LINKS_BASE_URL}${body.link_name}`,
        };

    if (signal?.aborted) return { success: false, error: "aborted" };
    return body;
}

export type UploadFileResult =
    | {
        success: true;
        result: "already_known";
        name: string;
    }
    | {
        success: true;
        result: "must_upload";
        name: string;
        upload_url: string;
    }
    | {
        success: false;
        error: string;
        message?: string;
        retry_in?: number;
    };

export async function upload_file(
    file_name: string, file_ext: string | undefined,
    mime_type: string, hash: string, size: number,
    signal?: AbortSignal
): Promise<UploadFileResult> {

    let rsp;
    try {
        rsp = await fetch(`${API_PATH}file/${file_name}${file_ext ? "." + file_ext : ""}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                file_hash: hash,
                mime_type,
                file_size: size,
            }),
            signal,
        });
    } catch (e) {
        if (e instanceof TypeError) {
            return { success: false, error: "other", message: e.message };
        }
        throw e;
    }
    const body = await rsp.json();

    if (signal?.aborted) return { success: false, error: "aborted" };
    return body;
}
