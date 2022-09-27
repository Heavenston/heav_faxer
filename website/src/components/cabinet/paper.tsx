import { component$, useRef, useStyles$, useStylesScoped$, useClientEffect$, useStore, useWatch$, useContext } from "@builder.io/qwik";
import styles from "./paper.scss?inline";
import globalStyles from "./paper_global.scss?inline";

export function trunc(x: number): number {
    return Math.trunc(x * 10000) / 10000;
}

export default component$(() => {
    useStylesScoped$(styles);
    useStyles$(globalStyles);

    const state = useStore({
        opened: false,
        rotation: Math.random() * 1 - 0.5,
        move: Math.random() * 8 - 4,
    });
    const ref = useRef<HTMLDivElement>();

    useClientEffect$(({ track }) => {
        const element = track(ref, "current");
        if (element === undefined) return;

        const onMouseEnter = () => { state.opened = true; };
        const onMouseLeave = () => { state.opened = false; };
        element.addEventListener("mouseenter", onMouseEnter);
        element.addEventListener("mouseleave", onMouseLeave);

        return () => { element.removeEventListener("mouseenter", onMouseEnter); element.removeEventListener("mouseleave", onMouseLeave); };
    });

    useClientEffect$(({ track }) => {
        const el = track(ref, "current");
        const opened = track(state, "opened");
        if (!opened || el === undefined) return;

        const bcr = el.getBoundingClientRect();
        const floating_paper = document.createElement("div");
        floating_paper.className = "floating-paper";
        document.body.appendChild(floating_paper);
        floating_paper.style.left = `${bcr.left}px`;
        floating_paper.style.top = `${bcr.top}px`;
        floating_paper.style.width = `${bcr.width}px`;
        floating_paper.style.setProperty("--rot", el.style.getPropertyValue("--rot"))

        return () => {
            floating_paper.classList.add("hide");
            setTimeout(() => {
                document.body.removeChild(floating_paper);
            }, 300);
        };
    });

    return <div
        ref={ref}
        class="paper"
        style={ `--rot: ${trunc(state.rotation)}deg; --move: ${trunc(state.move)}px;` }
    />
});
