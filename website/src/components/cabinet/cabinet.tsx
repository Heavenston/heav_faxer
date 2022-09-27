import { component$, createContext, useRef, useStylesScoped$, useClientEffect$, useStore, useWatch$, useContextProvider } from "@builder.io/qwik";
import styles from "./cabinet.scss?inline";

import { default as Drawer, prevent_drawer_open_context } from "./drawer";

export default component$(() => {
    useStylesScoped$(styles);
    const prevent_drawer_open = useStore({ index: -1 });
    useContextProvider(prevent_drawer_open_context, prevent_drawer_open);

    return <div class="cabinet">
        <Drawer label="Files" index={2} />
        <Drawer label="Links" index={1} />
    </div>;
});
