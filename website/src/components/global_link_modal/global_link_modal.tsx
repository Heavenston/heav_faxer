import { $, component$, createContext, Ref, useContext, useRef, useStylesScoped$ } from "@builder.io/qwik";
import { Link, useNavigate } from "@builder.io/qwik-city";
import styles from "./global_link_modal.scss?inline";

export const link_modal_context = createContext<{
    enable: boolean,
}>("link_modal_context");

export default component$(() => {
    useStylesScoped$(styles);
    const c = useContext(link_modal_context);
    const n = useNavigate();

    const inputRef = useRef<HTMLDivElement>();
    const previousRef = useRef<HTMLDivElement>();
    const paperRef = useRef<HTMLDivElement>();
    const nextRef = useRef<HTMLDivElement>();

    if (!c.enable) return <></>;

    const on_background_click = (e: MouseEvent) => {
        for (const a of [previousRef ,paperRef, nextRef]) {
            const cbr = a.current?.getBoundingClientRect();
            if (!cbr)
                return;
            if (e.clientX > cbr.x && e.clientX < (cbr.x + cbr.width) && e.clientY > cbr.y && e.clientY < (cbr.y + cbr.height))
                return;
        }

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

    const on_submit = $(() => {
        const v = inputRef.current?.innerText ?? "https://example.com";
        const r = `/link?link=${encodeURIComponent(v)}`;
        location.href = r;
    });

    return <div class="modal" onClick$={on_background_click}>
        <form class="paper" preventdefault:submit onSubmit$={on_submit} ref={paperRef}>
            <button type="reset" class="previous" ref={previousRef}>
                &lt;- Go back to previous screen
            </button>
            <label>
                <span class="label">Enter url here:</span>
                <div class="input" ref={inputRef} contentEditable="true" onKeyPress$={on_key_press} onInput$={on_input}></div>
            </label>
            <button type="submit" class="next" ref={nextRef}>
                Create the shortened link -&gt;
            </button>
        </form>
    </div>;
});
