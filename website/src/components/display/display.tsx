import { component$, useRef, useStyles$, useClientEffect$, useStore, useWatch$ } from "@builder.io/qwik";
import styles from "./display.scss?inline";

export default component$<{ text: string }>((props) => {
    useStyles$(styles);
    const state = useStore({
        display_length: 25,
        text_to_display: "!",
    });
    const ref = useRef<HTMLDivElement>();

    useWatch$(({ track }) => {
        const text = track(props, "text");
        const display_length = track(state, "display_length");

        if (text.length > display_length) {
            let current_index = 0;
            const i = setInterval(() => {
                let offset = current_index % (text.length + 5);
                state.text_to_display = (text + "     " + text).substring(offset, offset + display_length);

                current_index++;
            }, 150);
            return () => clearInterval(i);
        }
        else {
            state.text_to_display = text;
        }
    });

    useClientEffect$(({ track }) => {
        const el = track(ref, "current");
        if (el == undefined)
            return;

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

            const actual_width = el.getBoundingClientRect().width - parseInt(cl.paddingLeft) - parseInt(cl.paddingRight); 
            const n = Math.floor(actual_width / text.width);

            state.display_length = n;
        };
        window.addEventListener("resize", handlr);
        handlr();
        return () => window.removeEventListener("resize", handlr);
    });

    return (
        <div
            ref={ref}
            class="display"
            style={`--placeholder: '${"~".repeat(state.display_length ?? 0)}';`}
        >
            {state.text_to_display.replace(/ /g, "!")}
        </div>
    );
});
