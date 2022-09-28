import { component$, useClientEffect$, useWatch$ } from "@builder.io/qwik";
import { DocumentHead, useLocation, useNavigate } from "@builder.io/qwik-city";

import Machine from "~/components/fax_machine/fax_machine";

export default component$(() => {
    const loc = useLocation();
    const n = useNavigate();

    return (
        <div class="center">
            <Machine />
        </div>
    );
});

export const head: DocumentHead = {
    title: "Heav Faxer - Link",
};
