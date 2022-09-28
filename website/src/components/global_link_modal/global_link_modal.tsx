import { component$, createContext, useContext, useStylesScoped$ } from "@builder.io/qwik";
import styles from "./global_link_modal.scss?inline";

export const link_modal_context = createContext<{
    enable: boolean,
}>("link_modal_context");

export default component$(() => {
    useStylesScoped$(styles);
    const c = useContext(link_modal_context);
    if (!c.enable) return <></>;

    const on_background_click = (e: MouseEvent) => {
        const { target: t } = e;
        if (!(t instanceof HTMLDivElement))
            return;
        const cbr = t.children.item(0)?.getBoundingClientRect();
        if (!cbr)
            return;
        if (e.clientX > cbr.left && e.clientX < cbr.right && e.clientY > cbr.bottom && e.clientY < cbr.top)
            return;
        c.enable = false;
    };

    return <div class="modal" onClick$={on_background_click}>
        <div class="paper" preventdefault:click>
        </div>
    </div>;
});
