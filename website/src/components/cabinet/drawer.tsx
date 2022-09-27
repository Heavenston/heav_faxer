import { component$, useRef, useStyles$, useStylesScoped$, useClientEffect$, useStore, useWatch$, useContext, createContext, useContextProvider } from "@builder.io/qwik";
import styles from "./drawer.scss?inline";

import Paper from "./paper";

export const prevent_drawer_close_context = createContext<{ count: number }>("prevent_drawer_close_context");

export default component$<{ index: number, label: string }>(({ index, label }) => {
    useStylesScoped$(styles);
    const prevent_drawer_close = useStore({ count: 0 });
    useContextProvider(prevent_drawer_close_context, prevent_drawer_close);

    return <button class={`drawer ${prevent_drawer_close.count > 0 ? "prevent-close" : ""}`} tabIndex={index}>
        <div class="background">
            {Array(13).fill(null).map(_ => <Paper />)}
        </div>
        <div class="foreground">
            <span>{label}</span>
        </div>
    </button>;
});
