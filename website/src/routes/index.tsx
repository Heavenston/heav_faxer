import { component$, useStylesScoped$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

import styles from "./index.scss?inline";
import Drawer from "~/components/cabinet/cabinet";

export default component$(() => {
    useStylesScoped$(styles);

    return (
        <div class="container">
            <Drawer />
        </div>
    );
});

export const head: DocumentHead = {
    title: "Heav Faxer",
};
