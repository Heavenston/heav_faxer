import { component$, useRef, useStylesScoped$, useClientEffect$, useStore, useWatch$ } from "@builder.io/qwik";
import styles from "./paper.scss?inline";

export default component$<{ rotation: number, move: number }>(({ rotation, move }) => {
    useStylesScoped$(styles);

    rotation = Math.trunc(rotation * 10000) / 10000;
    move = Math.trunc(move * 10000) / 10000;
    return <div
        class="paper"
        style={`--rot: ${rotation}deg; --move: ${move}px`}
    />
});
