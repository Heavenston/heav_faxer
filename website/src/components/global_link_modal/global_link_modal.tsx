import {
    $,
    component$,
    createContextId,
    useContext,
    useStylesScoped$,
    useStore,
    useSignal,
    QwikMouseEvent,
    useTask$,
} from "@builder.io/qwik";
import { useNavigate } from "@builder.io/qwik-city";
import styles from "./global_link_modal.scss?inline";

export const link_modal_context = createContextId<{
    enable: boolean;
}>("link_modal_context");

export default component$(() => {
    useStylesScoped$(styles);
    const c = useContext(link_modal_context);
    const state = useStore({
        previous_enabled: c.enable,
        animating: false,
    });
    const nav = useNavigate();

    const inputRef = useSignal<HTMLDivElement>();
    const previousRef = useSignal<HTMLDivElement>();
    const paperRef = useSignal<HTMLDivElement>();
    const nextRef = useSignal<HTMLDivElement>();

    useTask$(({ track, cleanup }) => {
        track(() => c);
        if (c.enable == state.previous_enabled) return;
        state.previous_enabled = c.enable;
        state.animating = true;
        const i = setTimeout(() => {
            state.animating = false;
        }, 500);
        cleanup(() => clearTimeout(i));
    });

    const on_background_click = $((e: QwikMouseEvent) => {
        for (const a of [previousRef, paperRef, nextRef]) {
            const cbr = a.value?.getBoundingClientRect();
            if (!cbr) return;
            if (
                e.clientX > cbr.x &&
                e.clientX < cbr.x + cbr.width &&
                e.clientY > cbr.y &&
                e.clientY < cbr.y + cbr.height
            )
                return;
        }

        c.enable = false;
    });

    const on_key_press = $((e: KeyboardEvent) => {
        if (e.code == "Enter") {
            e.preventDefault();
            return;
        }
    });
    const on_input = $((e: KeyboardEvent) => {
        const t = e.target;
        if (!(t instanceof HTMLDivElement)) return;
        const changed = t.innerText.replace(/\n/g, "");
        if (changed != t.innerText) t.innerText = changed;
    });

    const on_submit = $(() => {
        const v = inputRef.value?.innerText ?? "https://example.com";
        const r = `/link?link=${encodeURIComponent(v)}`;
        c.enable = false;
        nav(r);
    });

    const on_previous = $(() => {
        c.enable = false;
    });

    const modal_style = c.enable || state.animating ? "" : "display: none;";
    const modal_class = `modal ${
        state.animating && (c.enable ? "show" : "hide")
    }`;

    return (
        <div
            class={modal_class}
            onClick$={on_background_click}
            style={modal_style}
        >
            <form
                class="paper"
                ref={paperRef}
                preventdefault:submit
                onSubmit$={on_submit}
            >
                <button
                    class="previous"
                    ref={previousRef}
                    preventdefault:click
                    onClick$={on_previous}
                >
                    &lt;- Go back to previous screen
                </button>
                <label>
                    <span class="label">Enter url here:</span>
                    <div
                        class="input"
                        ref={inputRef}
                        {...({ contenteditable: true } as any)}
                        onKeyPress$={on_key_press}
                        onInput$={on_input}
                    ></div>
                </label>
                <button type="submit" class="next" ref={nextRef}>
                    Create the shortened link -&gt;
                </button>
            </form>
        </div>
    );
});
