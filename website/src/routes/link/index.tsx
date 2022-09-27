import { component$ } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";

import Machine from "~/components/fax_machine/fax_machine";

export default component$(() => {

    return (
        <div class="center">
            <Machine />
        </div>
    );
});

export const head: DocumentHead = {
    title: "Heav Faxer - Link",
};
