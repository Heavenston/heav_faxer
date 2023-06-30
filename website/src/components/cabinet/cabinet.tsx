import {
    $,
    component$,
    useStylesScoped$,
    useStore,
    useContextProvider,
} from "@builder.io/qwik";
import styles from "./cabinet.scss?inline";

import { default as Drawer, prevent_drawer_open_context } from "./drawer";
import { useNavigate } from "@builder.io/qwik-city";

export default component$(() => {
    const navigate = useNavigate();

    useStylesScoped$(styles);
    const prevent_drawer_open = useStore({ index: -1 });
    useContextProvider(prevent_drawer_open_context, prevent_drawer_open);

    const goto_links = $(() => navigate("/link"));

    return (
        <div class="cabinet">
            <Drawer label="Files" index={2} />
            <Drawer label="Links" index={1} click_cb={goto_links} />
        </div>
    );
});
