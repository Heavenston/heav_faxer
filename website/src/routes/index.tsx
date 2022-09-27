import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

import "./index.scss";
import Machine from "~/components/fax_machine/fax_machine";
import Drawer from "~/components/drawer/drawer";

export default component$(() => {
    return (
        <div class="index-container center">
            <Drawer />
        </div>
    );
});

export const head: DocumentHead = {
    title: "Heav Faxer",
};
