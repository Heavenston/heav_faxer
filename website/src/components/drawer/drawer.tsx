import { component$, useRef, useStylesScoped$, useClientEffect$, useStore, useWatch$ } from "@builder.io/qwik";
import styles from "./drawer.scss?inline";

import Paper from "./paper";

export function D({ label, index }: { label: string, index: number }) {
    return <button tabIndex={index}>
        <div class="background">
            {Array(13).fill(null).map(_ => <Paper rotation={Math.random() * 1 - 0.5} move={Math.random() * 8 - 4} />)}
        </div>
        <div class="foreground">
            <span>{label}</span>
        </div>
    </button>;
}

export default component$(() => {
    useStylesScoped$(styles);

    return <div class="drawer">
        <D label="Files" index={2} />
        <D label="Links" index={1} />
    </div>;
});
