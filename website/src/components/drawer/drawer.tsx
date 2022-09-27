import { component$, useRef, useStyles$, useClientEffect$, useStore, useWatch$ } from "@builder.io/qwik";
import styles from "./drawer.scss?inline";

export default component$(() => {
    useStyles$(styles);

    return <div class="drawer">
        <button tabIndex={2} style="--label: 'Files';">
            <span style="display: none;">Files</span>
        </button>
        <button tabIndex={1} style="--label: 'Links';">
            <span style="display: none;">Links</span>
        </button>
    </div>;
});
