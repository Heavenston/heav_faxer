import { component$, useStylesScoped$, $, useSignal, useTask$, QRL } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";

import BackButton from "~/components/back_button/back_button"
import Machine, { SendFunction } from "~/components/fax_machine/fax_machine";
import * as api from "~/api";
import CryptoJS from "crypto-js";

import styles from "./index.scss?inline";

export default component$(() => {
    useStylesScoped$(styles);

    const file_value = useSignal<string | undefined>();
    const file_input = useSignal<HTMLInputElement | undefined>();

    const file_name = useSignal<string | undefined>();
    const img_preview = useSignal<string | undefined>();

    useTask$(({ track }) => {
        track(() => file_value.value);

        const file = file_input.value?.files?.item(0);
        if (!file)
            return;

        img_preview.value = file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : undefined;
        file_name.value = file.name;
    });

    const send: QRL<SendFunction> = $(async (set_status) => {
        if (file_input.value == undefined)
            throw "Unexpected error, try refreshing";
        if (file_value.value === undefined)
            throw "No paper detected";
        set_status(0, "Reading file");
        const file = file_input.value.files?.item(0);
        if (!(file instanceof File))
            throw "Expected file";
        if (file.size > 1_000_000_000)
            throw "File is too big";

        set_status(0, "Computing file hash...");

        const file_type = file.type;
        const file_size = file.size;

        const hasher = CryptoJS.algo.MD5.create();
        {
            const stream = file.stream();
            const reader = stream.getReader();

            let result: ReadableStreamReadResult<Uint8Array>;
            let processed = 0;
            while ((result = await reader.read()).value !== undefined) {
                const word_array = CryptoJS.lib.WordArray.create(
                    [], 0
                );
                for (let i = 0; i < result.value.length; i++) {
                    const byte = result.value.at(i) ?? 0;
                    const word_byte_idx = word_array.sigBytes % 4;
                    if (word_byte_idx === 0)
                        word_array.words.push(0);
                    const last_index = word_array.words.length - 1;
                    word_array.words[last_index] |= byte << (8 * (3 - word_byte_idx));
                    word_array.sigBytes += 1;
                }
                processed += word_array.sigBytes;

                console.log(word_array);
                hasher.update(word_array);

                set_status(0, `Hashing ${Math.floor(processed / file_size * 1000) / 10}%`);
                await new Promise<void>(r => setTimeout(r));
            }
        }
        const hash = CryptoJS.enc.Base64.stringify(hasher.finalize());

        console.log(file.name, "of size", file.size, "and hash", hash);

        set_status(0, "Requesting upload config");

        const splitted = file.name.split(".");
        const file_ext = splitted.length <= 1 ? undefined : splitted[splitted.length-1];
        // const file_name = splitted.slice(0, splitted.length <= 1 ? undefined : -1).join(".")
        const rs = await api.upload_file(
            "random",
            file_ext, file_type,
            hash, file_size,
        );
        if (!rs.success)
            throw rs.message ?? rs.error;
        set_status(0, "Starting upload");

        if (rs.result === "already_known")
            return `${api.FILES_BASE_URL}${rs.name}`;

        const rs2 = await (await import("axios")).default(
            rs.upload_url, {
                method: "PUT",
                data: file,
                headers: {
                    "Content-Type": file_type,
                    "Content-md5": hash,
                },
                onUploadProgress(u) {
                    set_status(u.progress ?? 0.5);
                }
            }
        );
        if (rs2.status !== 200)
            throw rs2.statusText;

        return `${api.FILES_BASE_URL}${rs.name}`;
    });
    const reset = $(() => {
        file_value.value = undefined;
    });

    return <>
        <div class="center container">
            <BackButton/>
            <Machine
                allow_reset={file_value.value !== undefined}
                show_input_paper={file_value.value !== undefined}
                input_msg="Provider a paper and press send"
                send_function={send}
                on_reset={reset}
            >
                <div q:slot="input-paper" class="input-paper-container">
                    <div class="file-name">{file_name.value}</div>
                    <img src={img_preview.value} style="max-width: 100%;" />
                </div>

                <form
                    q:slot="input-paper-container" class="paper-loader"
                    style={{
                        display: file_value.value === undefined ? undefined : "none",
                    }}
                >
                    <div>
                        <img src="/file-upload-outline.svg" />
                    </div>
                    <input ref={file_input} type="file" bind:value={file_value} />
                </form>
            </Machine>
        </div>
    </>
});

export const head: DocumentHead = {
    title: "Heav Faxer - File",
};
