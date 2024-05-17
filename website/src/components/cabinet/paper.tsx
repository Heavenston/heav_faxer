import {
    component$,
    useSignal,
    useStyles$,
    useStylesScoped$,
    useVisibleTask$,
    useStore,
    useContext,
    useOn,
    $,
} from "@builder.io/qwik";
import styles from "./paper.scss?inline";
import globalStyles from "./paper_global.scss?inline";

import { prevent_drawer_close_context } from "./drawer";

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
    const ref = useSignal<HTMLDivElement>();
    const prevent_drawer_close = useContext(prevent_drawer_close_context);

    useOn("mouseenter", $(() => {
        state.opened = true;
    }));
    useOn("mouseleave", $(() => {
        state.opened = false;
    }));

    useVisibleTask$(({ track, cleanup }) => {
        const el = track(() => ref.value);
        const opened = track(() => state.opened);
        if (!opened || el === undefined) return;

        const bcr = el.getBoundingClientRect();
        const floating_paper = document.createElement("div");
        floating_paper.className = "floating-paper";
        document.body.appendChild(floating_paper);
        floating_paper.style.left = `${bcr.left}px`;
        floating_paper.style.top = `${bcr.top}px`;
        floating_paper.style.width = `${bcr.width}px`;
        floating_paper.style.setProperty(
            "--rot",
            el.style.getPropertyValue("--rot")
        );
        floating_paper.style.zIndex = `${Math.trunc(bcr.y / 10)}`;

        prevent_drawer_close.count += 1;

        cleanup(() => {
            floating_paper.classList.add("hide");
            setTimeout(() => {
                document.body.removeChild(floating_paper);
                prevent_drawer_close.count -= 1;
            }, 350);
        });
    });

    return (
        <div
            ref={ref}
            class="paper"
            style={`--rot: ${trunc(state.rotation)}deg; --move: ${trunc(
                state.move
            )}px;`}
        />
    );
});
