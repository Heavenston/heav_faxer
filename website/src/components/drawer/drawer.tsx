import { component$, useRef, useStyles$, useClientEffect$, useStore, useWatch$ } from "@builder.io/qwik";
import styles from "./drawer.scss?inline";

export default component$(() => {
    useStyles$(styles);

    return <div class="drawer">
        <button tabIndex={2} style="--label: 'Files';">
            <div class="background" />
            <div class="foreground">
                <span>Files</span>
            </div>
        </button>
        <button tabIndex={1}>
            <div class="background" />
            <div class="foreground">
                <span>Links</span>
            </div>
        </button>
    </div>;
});
