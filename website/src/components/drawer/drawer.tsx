import { component$, useRef, useStylesScoped$, useClientEffect$, useStore, useWatch$ } from "@builder.io/qwik";
import styles from "./drawer.scss?inline";

export function P({ rotation, move }: { rotation: number, move: number }){
    rotation = Math.trunc(rotation * 10000) / 10000;
    move = Math.trunc(move * 10000) / 10000;
    return <div style={`--rot: ${rotation}deg; --move: ${move}px`} />
}

export function D({ label, index }: { label: string, index: number }) {
    return <button tabIndex={index}>
        <div class="background">
            {Array(13).fill(null).map(_ => <P rotation={Math.random() * 1 - 0.5} move={Math.random() * 8 - 4} />)}
        </div>
        <div class="foreground">
            <span>{label}</span>
        </div>
    </button>;
}

export default component$(() => {
    useStylesScoped$(styles);

    return <div class="drawer">
        <D label="Files" index={2} />
        <D label="Links" index={1} />
    </div>;
});
