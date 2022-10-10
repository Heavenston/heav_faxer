import { $, useOn, useStore } from "@builder.io/qwik";

export default function use_hovering(): { hovering: boolean } {
    const s = useStore({ hovering: false });

    useOn("mouseenter", $(() => {
        s.hovering = true;
    }));
    useOn("mouseleave", $(() => {
        s.hovering = false;
    }));

    return s;
}
