import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

import "./index.css";
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
