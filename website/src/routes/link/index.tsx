import { component$, useStylesScoped$, $, useSignal } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";

import BackButton from "~/components/back_button/back_button"
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
        const api = await import("~/api");

        const as_url = () => {
            try {
                const url = new URL(link_input.value);
                if (url.host.length === 0)
                    return false;
                if (url.hostname.length === 0)
                    return false;
                return url;
            } catch {
                return false;
            }
        };
        const as_yaml = async () => {
            try {
                const yaml = await import("yaml");
                const parsed = yaml.parse(link_input.value) as unknown;
                if (!(parsed instanceof Object))
                    return false;
                if (!("target" in parsed) || typeof parsed.target !== "string")
                    return false;
                if (("pass" in parsed) && typeof parsed.pass !== "string")
                    return false;
                if (("name" in parsed) && typeof parsed.name !== "string")
                    return false;
                return parsed as { target: string, pass?: string, name?: string };
            } catch {
                return false;
            }
        };
        const url = as_url();
        const yaml = url === false ? await as_yaml() : true;
        console.log({ url, yaml });

        let final_name = "random";
        let final_target = link_input.value;
        let final_password = null;

        if (url === false && typeof yaml !== "boolean") {
            if (yaml.name !== undefined)
                final_name = yaml.name;
            if (yaml.pass !== undefined)
                final_password = yaml.name;
            final_target = yaml.target;
        }

        if (url === false && yaml === false) {
            if (!final_target.startsWith("http://"))
                throw "Invalid url, must include http(s)://";
            throw "Invalid url";
        }

        const result = Object.freeze(
            await api.upload_link(
                final_name, final_target, final_password ?? undefined
            )
        );
        if (!result.success) {
            if (
                result.error === "Too Many Requests" &&
                typeof result.retry_in === "number"
            ) {
                throw `Rate limited, retry after ${Math.floor(
                    result.retry_in / 60
                )} mn ${result.retry_in % 60} s`;
            }
            throw result.message ?? result.error;
        }

        return result.shortened_to;
    });

    const reset = $(() => {
        link_input.value = "";
    });

    return <>
        <div class="center container">
            <BackButton/>
            <Machine send_function={send} on_reset={reset}>
                <textarea
                    autoFocus
                    class="area"
                    bind:value={link_input}
                    placeholder="Your link here"
                    autoCorrect="off"
                    spellcheck={false}
                    wrap="hard"
                />
            </Machine>
        </div>
    </>
});

export const head: DocumentHead = {
    title: "Heav Faxer - Link",
};
