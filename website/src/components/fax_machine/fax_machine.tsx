import { $, component$, useRef, useOnWindow, useStyles$, useClientEffect$, useStore } from "@builder.io/qwik";
import styles from "./fax_machine.css?inline";

import Display from "~/components/display/display";

export default component$(() => {
    useStyles$(styles);
    return (
        <div class="machine">
            <Display text="ABCDEFGHIJKLMNOPQRSTUVWXYZ l'alphabet est" />
        </div>
    );
});
