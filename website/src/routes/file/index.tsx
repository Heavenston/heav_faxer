import { component$, useStylesScoped$, $, useSignal, useTask$, QRL } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";

import BackButton from "~/components/back_button/back_button"
import Machine, { SendFunction } from "~/components/fax_machine/fax_machine";
import * as api from "~/api";

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
        const file = file_input.value.files?.item(0);
        if (!(file instanceof File))
            throw "Expected file";

        set_status(0, "Computing file hash...");

        const file_content = new Uint8Array(await file.arrayBuffer());
        const file_type = file.type;

        console.log(file_content.length);

        const { default: md5 } = await import("md5");
        const hash = btoa(String.fromCharCode.apply(null, md5(
            file_content, { asBytes: true }
        )));

        console.log(file_content.length);

        set_status(0, "Requesting upload config");

        const splitted = file.name.split(".");
        const file_ext = splitted.length <= 1 ? undefined : splitted[splitted.length-1];
        // const file_name = splitted.slice(0, splitted.length <= 1 ? undefined : -1).join(".")
        const rs = await api.upload_file(
            "random",
            file_ext, file_type,
            hash, file_content.length,
        );
        if (!rs.success)
            throw rs.message ?? rs.error;
        set_status(0, "Starting upload");

        if (rs.result === "already_known")
            return `${api.FILES_BASE_URL}${rs.name}`;

        const rs2 = await (await import("axios")).default.put(
            rs.upload_url, file_content,
            {
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
