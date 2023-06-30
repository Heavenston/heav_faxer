import { $, Signal, useOn, useSignal } from "@builder.io/qwik";

export default function use_hovering(): Signal<Boolean> {
    const s = useSignal(false);

    useOn(
        "mouseenter",
        $(() => {
            s.value = true;
        })
    );
    useOn(
        "mouseleave",
        $(() => {
            s.value = false;
        })
    );

    return s;
}
