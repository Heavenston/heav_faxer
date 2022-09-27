import { component$, useRef, useStyles$, useClientEffect$, useStore, useWatch$ } from "@builder.io/qwik";
import styles from "./drawer.scss?inline";

export default component$(() => {
    useStyles$(styles);

    return <div class="drawer">
        <div>
        </div>
        <div>
        </div>
    </div>;
});
