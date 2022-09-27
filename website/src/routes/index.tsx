import { component$, useStylesScoped$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

import styles from "./index.scss?inline";
import Machine from "~/components/fax_machine/fax_machine";
import Drawer from "~/components/cabinet/cabinet";

export default component$(() => {
    useStylesScoped$(styles);

    return (
        <div class="container">
            <Drawer />
            <Machine />
        </div>
    );
});

export const head: DocumentHead = {
    title: "Heav Faxer",
};
