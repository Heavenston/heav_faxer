import { component$, useRef, useStyles$, useClientEffect$, useStore, useWatch$ } from "@builder.io/qwik";
import styles from "./drawer.scss?inline";

export default component$(() => {
    useStyles$(styles);

    return <div class="drawer">
        <div>
            <div class="bar left-bar" />
            <div class="bar right-bar" />
        </div>
        <div>
            <div class="bar left-bar" />
            <div class="bar right-bar" />
        </div>
    </div>;
});
