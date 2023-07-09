import { component$, useStylesScoped$, $, useSignal, useTask$ } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";

import BackButton from "~/components/back_button/back_button"
import Machine from "~/components/fax_machine/fax_machine";

import styles from "./index.scss?inline";

export default component$(() => {
    useStylesScoped$(styles);

    const file_value = useSignal<string | undefined>();
    const file_input = useSignal<HTMLInputElement | undefined>();

    const file_name = useSignal<string | undefined>();
    const img_preview = useSignal<string | undefined>();

    useTask$(({ track }) => {
        track(() => file_value.value);

        let file = file_input.value?.files?.item(0);
        if (file) {
            img_preview.value = URL.createObjectURL(file);
            file_name.value = file.name;
        }
    });

    const send = $(async () => {
        if (file_input.value == undefined)
            throw "Unexpected error, try refreshing";
        if (file_value.value === undefined)
            throw "No paper detected";
        let file = file_input.value.files?.item(0);
        if (!(file instanceof File))
            throw "Expected file";

        throw "no";
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
