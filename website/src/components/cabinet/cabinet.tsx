import { component$, $, createContext, useRef, useStylesScoped$, useClientEffect$, useStore, useWatch$, useContextProvider, useContext } from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import styles from "./cabinet.scss?inline";

import { default as Drawer, prevent_drawer_open_context } from "./drawer";
import { link_modal_context } from "~/components/global_link_modal/global_link_modal";

export default component$(() => {
    useStylesScoped$(styles);
    const prevent_drawer_open = useStore({ index: -1 });
    useContextProvider(prevent_drawer_open_context, prevent_drawer_open);

    const lm = useContext(link_modal_context);
    const link_click = $(() => {
        lm.enable = true;
    });

    return <div class="cabinet">
        <Drawer label="Files" index={2} />
        <Drawer label="Links" index={1} click_cb={link_click} />
    </div>;
});
