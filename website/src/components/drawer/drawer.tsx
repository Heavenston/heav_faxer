import { component$, createContext, useRef, useStylesScoped$, useClientEffect$, useStore, useWatch$, useContextProvider } from "@builder.io/qwik";
import styles from "./drawer.scss?inline";

import Paper from "./paper";

export const prevent_drawer_close_context = createContext<{ count: number }>("prevent_drawer_close");

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
    const prevent_drawer_close = useStore({
        count: 0,
    });
    useContextProvider(prevent_drawer_close_context, prevent_drawer_close);
    console.log(prevent_drawer_close.count);

    return <div class={`drawer ${prevent_drawer_close.count > 0 ? "prevent-close" : ""}`}>
        <D label="Files" index={2} />
        <D label="Links" index={1} />
    </div>;
});
