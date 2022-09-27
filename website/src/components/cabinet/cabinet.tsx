import { component$, createContext, useRef, useStylesScoped$, useClientEffect$, useStore, useWatch$, useContextProvider } from "@builder.io/qwik";
import styles from "./cabinet.scss?inline";

import Paper from "./paper";

export function D({ label, index }: { label: string, index: number }) {
    return <button tabIndex={index}>
        <div class="background">
            {Array(13).fill(null).map(_ => <Paper />)}
        </div>
        <div class="foreground">
            <span>{label}</span>
        </div>
    </button>;
}

export default component$(() => {
    useStylesScoped$(styles);

    return <div class="cabinet">
        <D label="Files" index={2} />
        <D label="Links" index={1} />
    </div>;
});
