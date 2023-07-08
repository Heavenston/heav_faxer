import { component$, useStylesScoped$, $, useSignal } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";

import BackButton from "~/components/back_button/back_button"
import Machine from "~/components/fax_machine/fax_machine";

export default component$(() => {
    // useStylesScoped$(styles);

    const send = $(async () => {
        return "";
    });
    const reset = $(() => {});

    return <>
        <div class="center container">
            <BackButton/>
            <Machine
                input_msg="Please insert a file"
                send_function={send}
                on_reset={reset}
            >
                <div>Todo</div>
            </Machine>
        </div>
    </>
});

export const head: DocumentHead = {
    title: "Heav Faxer - File",
};
