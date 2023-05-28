import {
    component$,
    useStylesScoped$,
} from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";

import Machine from "~/components/fax_machine/fax_machine";

export default component$(() => {
    useStylesScoped$(`
        .container {
            padding: 10px;
        }
    `);

    return (
        <div class="center container">
            <Machine />
        </div>
    );
});

export const head: DocumentHead = {
    title: "Heav Faxer - Link",
};
