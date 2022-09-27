import { component$, createContext, useRef, useStylesScoped$, useClientEffect$, useStore, useWatch$, useContextProvider } from "@builder.io/qwik";
import styles from "./cabinet.scss?inline";

import Drawer from "./drawer";

export default component$(() => {
    useStylesScoped$(styles);

    return <div class="cabinet">
        <Drawer label="Files" index={2} />
        <Drawer label="Links" index={1} />
    </div>;
});
