import { component$, useRef, useStyles$, useStylesScoped$, useClientEffect$, useStore, useWatch$, useContext } from "@builder.io/qwik";
import styles from "./drawer.scss?inline";

import Paper from "./paper";

export default component$<{ index: number, label: string }>(({ index, label }) => {
    useStylesScoped$(styles);

    return <button class="drawer" tabIndex={index}>
        <div class="background">
            {Array(13).fill(null).map(_ => <Paper />)}
        </div>
        <div class="foreground">
            <span>{label}</span>
        </div>
    </button>;
});
