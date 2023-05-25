import {
    component$,
    useClientEffect$,
    useStylesScoped$,
    useWatch$,
} from "@builder.io/qwik";
import { DocumentHead, useLocation, useNavigate } from "@builder.io/qwik-city";

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
