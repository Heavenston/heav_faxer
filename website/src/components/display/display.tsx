import {
    component$,
    useSignal,
    useStylesScoped$,
    useVisibleTask$,
    useStore,
    useTask$,
} from "@builder.io/qwik";
import styles from "./display.scss?inline";

export type Props = {
    text: string,
    state?: "normal" | "error" | "success",
};

export default component$<Props>(props => {
    useStylesScoped$(styles);
    const state = useStore({
        display_length: 25,
        text_to_display: "!",
        current_index: 0,
    });
    const ref = useSignal<HTMLDivElement>();

    useTask$(({ track }) => {
        track(() => props.text);
        state.current_index = 0;
    });

    useVisibleTask$(({ track, cleanup }) => {
        const text = track(() => props.text);
        const display_length = track(() => state.display_length);

        if (text.length > display_length) {
            const i = setInterval(() => {
                const offset = state.current_index % (text.length + 5);
                state.text_to_display = (text + "     " + text).substring(
                    offset,
                    offset + display_length
                );

                state.current_index++;
            }, 150);
            cleanup(() => clearInterval(i));
        } else {
            state.text_to_display = text;
        }
    });

    useVisibleTask$(({ track, cleanup }) => {
        const el = track(() => ref.value);
        if (el == undefined) return;

        const handlr = () => {
            const cl = getComputedStyle(el);

            const c: HTMLCanvasElement = document.createElement("canvas");
            const ctx = c.getContext("2d");
            if (ctx == null) {
                console.error("Unsuported");
                return;
            }
            ctx.font = `${cl.fontSize} ${cl.fontFamily}`;
            const text = ctx.measureText("~");

            const actual_width =
                el.getBoundingClientRect().width -
                parseInt(cl.paddingLeft) -
                parseInt(cl.paddingRight);
            const n = Math.floor(actual_width / text.width);

            state.display_length = n;
        };
        const observer = new ResizeObserver(handlr);
        observer.observe(el);
        cleanup(() => observer.disconnect());
    });

    return (
        <div
            ref={ref}
            class={{
                "display": true,
                "state-normal": props.state === undefined || props.state === "normal",
                "state-error": props.state === "error",
                "state-success": props.state === "success",
            }}
            style={`
                --placeholder: '${"~".repeat(state.display_length ?? 0)}';
            `}
        >
            {state.text_to_display.replace(/ /g, "!").replace(/:/g, "!")}
        </div>
    );
});
