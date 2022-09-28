import { component$, createContext, useContext, useRef, useStylesScoped$ } from "@builder.io/qwik";
import styles from "./global_link_modal.scss?inline";

export const link_modal_context = createContext<{
    enable: boolean,
}>("link_modal_context");

export default component$(() => {
    useStylesScoped$(styles);
    const c = useContext(link_modal_context);
    if (!c.enable) return <></>;

    const paperRef = useRef<HTMLDivElement>();
    const on_background_click = (e: MouseEvent) => {
        const cbr = paperRef.current?.getBoundingClientRect();
        if (!cbr)
            return;
        if (e.clientX > cbr.x && e.clientX < (cbr.x + cbr.width) && e.clientY > cbr.y && e.clientY < (cbr.y + cbr.height))
            return;
        c.enable = false;
    };

    const on_key_press = (e: KeyboardEvent) => {
        if (e.code == "Enter") {
            e.preventDefault();
            return;
        }
    };
    const on_input = (e: KeyboardEvent) => {
        const t = e.target;
        if (!(t instanceof HTMLDivElement))
            return;
        const changed = t.innerText.replace(/\n/g, "");
        if (changed != t.innerText)
            t.innerText = changed;
    };

    return <div class="modal" onClick$={on_background_click}>
        <form class="paper" preventdefault:submit preventdefault:click ref={paperRef}>
            <label>
                <span class="label">Enter url here:</span>
                <div class="input" contentEditable="true" onKeyPress$={on_key_press} onInput$={on_input}></div>
            </label>
        </form>
    </div>;
});
