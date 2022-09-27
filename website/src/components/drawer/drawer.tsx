import { component$, useRef, useStyles$, useClientEffect$, useStore, useWatch$ } from "@builder.io/qwik";
import styles from "./drawer.scss?inline";

export function D({ label, index }: { label: string, index: number }) {
    return <button tabIndex={index}>
        <div class="background">
        </div>
        <div class="foreground">
            <span>{label}</span>
        </div>
    </button>;
}

export default component$(() => {
    useStyles$(styles);

    return <div class="drawer">
        <D label="Files" index={2} />
        <D label="Links" index={1} />
    </div>;
});
