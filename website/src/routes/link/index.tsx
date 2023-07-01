import {
    component$,
    useStylesScoped$,
    $,
    useSignal,
} from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";
import * as api from "~/api";

import Machine from "~/components/fax_machine/fax_machine";

export default component$(() => {
    useStylesScoped$(`
        .container {
            padding: 10px;
        }
        .area {
            position: relative;

            border: none;
            overflow: auto;
            outline: none;
            font-family: inherit;
            font-size: inherit;

            -webkit-box-shadow: none;
            -moz-box-shadow: none;
            box-shadow: none;

            resize: none;

            width: 100%;
            height: 100%;
        }
    `);
    const link_input = useSignal("");

    const send = $(async () => {
        try {
            new URL(link_input.value);
        }
        catch {
            if (!link_input.value.startsWith("http://"))
                throw "Invalid url, must include http(s)://";
            throw "Invalid url";
        }

        const result = Object.freeze(await api.upload_link("random", link_input.value));
        if (!result.success) {
            if (result.error === "Too Many Requests" && typeof result.retry_in === "number") {
                throw `Rate limited, retry after ${Math.floor(result.retry_in / 60)} mn ${result.retry_in % 60} s`;
            }
            throw result.message ?? result.error;
        }

        return result.shortened_to;
    });

    const reset = $(() => {
        link_input.value = "";
    });

    return (
        <div class="center container">
            <Machine send_function={send} on_reset={reset}>
                <textarea
                    autoFocus class="area" bind:value={link_input}
                    placeholder="Your link here"
                />
            </Machine>
        </div>
    );
});

export const head: DocumentHead = {
    title: "Heav Faxer - Link",
};
