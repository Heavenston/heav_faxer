import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Link } from "@builder.io/qwik-city";

import "./index.css";
import FaxMachine from "~/components/fax_machine/fax_machine";

export default component$(() => {
    return (
        <div class="index-container center">
            <FaxMachine />
        </div>
    );
});

export const head: DocumentHead = {
    title: "Heav Faxer",
};
